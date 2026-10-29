"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { getViewer } from "@/lib/auth";
import { RATE_LIMITS, rateLimit, rateLimitSubject, rateLimitedResult } from "@/lib/rate-limit";

const HANDLE_RE = /^[a-z0-9_]{3,20}$/;
const CATEGORIES = ["grinder", "brewer", "espresso", "roaster", "kettle", "scale"] as const;

const onboardingSchema = z.object({
  name: z.string().trim().min(1, "Tell us what to call you.").max(60, "Keep it under 60 characters."),
  handle: z
    .string()
    .trim()
    .toLowerCase()
    .regex(HANDLE_RE, "3–20 characters: lowercase letters, numbers, underscores."),
  credentials: z.string().trim().max(120, "Keep it under 120 characters.").optional().or(z.literal("")),
  bio: z.string().trim().max(280, "Keep it under 280 characters.").optional().or(z.literal("")),
  focus: z.enum(["brew", "roast", "both"]).optional(),
  equipment: z
    .array(
      z.object({
        category: z.enum(CATEGORIES, { message: "Pick a category." }),
        name: z.string().trim().min(1, "Name your gear.").max(80, "Keep it under 80 characters."),
        blurb: z.string().trim().max(160, "Keep it under 160 characters.").optional().or(z.literal("")),
      }),
    )
    .max(3, "Add up to 3 items for now."),
});

export type OnboardingInput = z.input<typeof onboardingSchema>;
export type OnboardingResult =
  | { ok: true }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]>; code?: "RATE_LIMITED" };

/** Live uniqueness check for the handle field. */
export async function checkHandle(raw: string): Promise<{ available: boolean; reason?: string }> {
  const handle = raw.trim().toLowerCase();
  if (!HANDLE_RE.test(handle)) return { available: false, reason: "3–20 characters: a-z, 0-9, _" };
  const viewer = await getViewer();
  const rl = await rateLimit("checkHandle", await rateLimitSubject(viewer?.id), RATE_LIMITS.checkHandle);
  if (!rl.ok) return { available: false, reason: `Slow down — try again in ${rl.retryAfterSec}s.` };
  const taken = await db.user.findUnique({ where: { handle }, select: { id: true } });
  if (taken && taken.id !== viewer?.id) return { available: false, reason: "That handle is taken." };
  return { available: true };
}

export async function completeOnboarding(input: OnboardingInput): Promise<OnboardingResult> {
  const parsed = onboardingSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      (fieldErrors[issue.path.join(".")] ??= []).push(issue.message);
    }
    return { ok: false, error: "Some fields need attention.", fieldErrors };
  }

  const viewer = await getViewer();
  if (!viewer) return { ok: false, error: "Sign in to set up your profile." };
  const rl = await rateLimit("completeOnboarding", await rateLimitSubject(viewer.id), RATE_LIMITS.completeOnboarding);
  if (!rl.ok) return rateLimitedResult(rl.retryAfterSec);

  const { name, handle, credentials, bio, equipment } = parsed.data;

  const clash = await db.user.findUnique({ where: { handle }, select: { id: true } });
  if (clash && clash.id !== viewer.id) {
    return { ok: false, error: "That handle is taken.", fieldErrors: { handle: ["That handle is taken."] } };
  }

  try {
    await db.$transaction([
      db.user.update({
        where: { id: viewer.id },
        data: {
          name,
          handle,
          credentials: credentials || null,
          bio: bio || null,
          onboardedAt: viewer.onboardedAt ?? new Date(),
        },
      }),
      ...(equipment.length
        ? [
            db.equipment.createMany({
              data: equipment.map((e) => ({
                userId: viewer.id,
                category: e.category,
                name: e.name,
                blurb: e.blurb || null,
              })),
            }),
          ]
        : []),
    ]);
  } catch (e) {
    console.error("completeOnboarding failed", e);
    return { ok: false, error: "Couldn't save your profile. Please try again." };
  }

  revalidatePath("/", "layout");
  return { ok: true };
}
