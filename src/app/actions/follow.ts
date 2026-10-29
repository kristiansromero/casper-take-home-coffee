"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getViewer } from "@/lib/auth";
import { RATE_LIMITS, rateLimit, rateLimitSubject, rateLimitedResult } from "@/lib/rate-limit";

export type FollowResult =
  | { ok: true; following: boolean; followers: number }
  | { ok: false; error: string; code?: "RATE_LIMITED" };

/** Follow the target if not already following, otherwise unfollow. Never throws. */
export async function toggleFollow(
  targetUserId: string,
): Promise<FollowResult> {
  try {
    const viewer = await getViewer();
    if (!viewer) return { ok: false, error: "Sign in to follow brewers." };
    const rl = await rateLimit("toggleFollow", await rateLimitSubject(viewer.id), RATE_LIMITS.toggleFollow);
    if (!rl.ok) return rateLimitedResult(rl.retryAfterSec);
    if (typeof targetUserId !== "string" || !targetUserId)
      return { ok: false, error: "Unknown brewer." };
    if (targetUserId === viewer.id)
      return { ok: false, error: "You can't follow yourself." };

    const target = await db.user.findUnique({
      where: { id: targetUserId },
      select: { id: true },
    });
    if (!target) return { ok: false, error: "That brewer no longer exists." };

    const pair = { followerId: viewer.id, followingId: target.id };
    const existing = await db.follow.findUnique({
      where: { followerId_followingId: pair },
    });
    if (existing) {
      await db.follow.deleteMany({ where: pair });
    } else {
      await db.follow.upsert({
        where: { followerId_followingId: pair },
        update: {},
        create: pair,
      });
    }

    const followers = await db.follow.count({
      where: { followingId: target.id },
    });

    revalidatePath("/");
    revalidatePath(`/profile/${target.id}`);
    revalidatePath(`/profile/${viewer.id}`);
    return { ok: true, following: !existing, followers };
  } catch (err) {
    console.error("toggleFollow failed", err);
    return { ok: false, error: "Could not update follow. Please try again." };
  }
}
