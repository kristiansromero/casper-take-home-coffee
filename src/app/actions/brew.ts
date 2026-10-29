"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getViewer } from "@/lib/auth";
import { RATE_LIMITS, rateLimit, rateLimitSubject, rateLimitedResult } from "@/lib/rate-limit";
import { upsertBean } from "@/lib/beans";
import { brewSchema, type BrewInput } from "@/app/brew/schema";

export type BrewResult =
  | { ok: true; id: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]>; code?: "RATE_LIMITED" };

export async function createBrew(input: BrewInput): Promise<BrewResult> {
  const parsed = brewSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      (fieldErrors[issue.path.join(".")] ??= []).push(issue.message);
    }
    return { ok: false, error: "Some fields need attention.", fieldErrors };
  }

  // requireViewer() throws; check explicitly so the client gets a clean error instead.
  const viewer = await getViewer();
  if (!viewer) return { ok: false, error: "Sign in to log brews." };
  const rl = await rateLimit("createBrew", await rateLimitSubject(viewer.id), RATE_LIMITS.createBrew);
  if (!rl.ok) return rateLimitedResult(rl.retryAfterSec);

  const { bean: beanInput, brewerId, grinderId, notes, ...brew } = parsed.data;

  try {
    // Only the viewer's own equipment may be attached.
    const equipmentIds = [...new Set([brewerId, grinderId].filter((id): id is string => !!id))];
    if (equipmentIds.length) {
      const owned = await db.equipment.count({ where: { id: { in: equipmentIds }, userId: viewer.id } });
      if (owned !== equipmentIds.length) return { ok: false, error: "Unknown equipment selected." };
    }

    const bean = await upsertBean(beanInput);
    const { id } = await db.extraction.create({
      data: {
        ...brew,
        notes: notes || null,
        userId: viewer.id,
        beanId: bean.id,
        brewerId: brewerId ?? null,
        grinderId: grinderId ?? null,
      },
      select: { id: true },
    });

    revalidatePath("/");
    revalidatePath(`/profile/${viewer.id}`);
    return { ok: true, id };
  } catch (err) {
    console.error("createBrew failed", err);
    return { ok: false, error: "Could not save this brew. Please try again." };
  }
}
