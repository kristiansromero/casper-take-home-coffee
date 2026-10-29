import "server-only";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";

// Without Clerk keys the app runs in "demo mode": reads stay public and writes are
// attributed to the first reviewer account so the logging flows are still testable.
// (`npx clerk@latest init` writes temporary dev keys without needing an account.)
export const clerkEnabled = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

export const DEMO_EMAIL = "reviewer1@beanwater.demo";

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
  const name = [cu?.firstName, cu?.lastName].filter(Boolean).join(" ") || cu?.username || email.split("@")[0];
  const handle = `${email.split("@")[0].replace(/[^a-z0-9]/gi, "").toLowerCase()}${userId.slice(-4).toLowerCase()}`;

  return db.user.upsert({
    where: { email },
    update: { clerkId: userId },
    create: { clerkId: userId, email, name, handle },
  });
}

/** For signed-in pages: null when signed out; sends signed-in users who haven't onboarded to /onboarding. */
export async function getOnboardedViewer() {
  const viewer = await getViewer();
  if (viewer && !viewer.onboardedAt) redirect("/onboarding");
  return viewer;
}

/** For Server Actions: throws when nobody is signed in. */
export async function requireViewer() {
  const viewer = await getViewer();
  if (!viewer) throw new Error("Sign in to log brews and roasts.");
  return viewer;
}
