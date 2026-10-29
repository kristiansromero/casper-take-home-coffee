import "server-only";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

// Without Clerk keys the app runs in "demo mode": reads stay public and writes are
// attributed to the first reviewer account so the logging flows are still testable.
// (`npx clerk@latest init` writes temporary dev keys without needing an account.)
export const clerkEnabled = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

export const DEMO_EMAIL = "reviewer1@beanwater.demo";

/** Lowercase a-z0-9_ slug, 3–20 chars, suitable for a handle. */
export function slugifyHandle(raw: string) {
  const base = raw
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 16);
  return base.length >= 3 ? base : `brewer${base}`.slice(0, 16);
}

/** First free handle starting from `base`, appending a numeric/random suffix on collision. */
async function uniqueHandle(base: string) {
  const root = slugifyHandle(base);
  for (let i = 0; i < 6; i++) {
    const candidate = i === 0 ? root : `${root}${i < 3 ? i + 1 : Math.floor(Math.random() * 9000 + 1000)}`;
    const taken = await db.user.findUnique({ where: { handle: candidate }, select: { id: true } });
    if (!taken) return candidate;
  }
  return `${root.slice(0, 12)}_${Math.random().toString(36).slice(2, 8)}`;
}

/** The signed-in user's DB row, or null when signed out. */
export async function getViewer() {
  if (!clerkEnabled) return db.user.findUnique({ where: { email: DEMO_EMAIL } });

  const { auth, currentUser } = await import("@clerk/nextjs/server");
  const { userId } = await auth();
  if (!userId) return null;

  const existing = await db.user.findUnique({ where: { clerkId: userId } });
  if (existing) return existing;

  // First sign-in: link to a seeded row with the same email, or create one.
  const cu = await currentUser();
  const email = cu?.primaryEmailAddress?.emailAddress ?? `${userId}@users.beanwater.demo`;

  const seeded = await db.user.findUnique({ where: { email } });
  if (seeded) return db.user.update({ where: { id: seeded.id }, data: { clerkId: userId } });

  const name =
    [cu?.firstName, cu?.lastName].filter(Boolean).join(" ") || cu?.username || email.split("@")[0];

  // Retry on a race (two first requests at once, or a handle grabbed between check and insert).
  for (let attempt = 0; attempt < 3; attempt++) {
    const handle = await uniqueHandle(cu?.username || email.split("@")[0]);
    try {
      return await db.user.create({ data: { clerkId: userId, email, name, handle } });
    } catch (e) {
      if (!(e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002")) throw e;
      const raced = await db.user.findFirst({ where: { OR: [{ clerkId: userId }, { email }] } });
      if (raced) return raced.clerkId ? raced : db.user.update({ where: { id: raced.id }, data: { clerkId: userId } });
    }
  }
  throw new Error("Could not create your BeanWater profile. Please try again.");
}

/** For signed-in pages: null when signed out; sends signed-in users who haven't onboarded to /onboarding. */
export async function getOnboardedViewer() {
  const viewer = await getViewer();
  // Demo mode has no onboarding flow — the demo reviewer is always treated as onboarded.
  if (clerkEnabled && viewer && !viewer.onboardedAt) redirect("/onboarding");
  return viewer;
}

/** For Server Actions: throws when nobody is signed in. */
export async function requireViewer() {
  const viewer = await getViewer();
  if (!viewer) throw new Error("Sign in to log brews and roasts.");
  return viewer;
}
