import "server-only";
import { headers } from "next/headers";
import { db } from "@/lib/db";

export type RateLimitOptions = { limit: number; windowSec: number };
export type RateLimitResult = { ok: true; remaining: number } | { ok: false; retryAfterSec: number };

/** Per-action limits. Keys are also used as the action prefix in the RateLimit table. */
export const RATE_LIMITS = {
  createBrew: { limit: 10, windowSec: 60 },
  createRoast: { limit: 10, windowSec: 60 },
  toggleFollow: { limit: 30, windowSec: 60 },
  createEquipment: { limit: 10, windowSec: 60 },
  completeOnboarding: { limit: 5, windowSec: 60 },
  checkHandle: { limit: 60, windowSec: 60 },
  bennyMinute: { limit: 3, windowSec: 60 },
  bennyDay: { limit: 20, windowSec: 60 * 60 * 24 },
} as const satisfies Record<string, RateLimitOptions>;

/**
 * Fixed-window counter in Postgres. One atomic upsert per call, so concurrent
 * requests across serverless instances share the same count. Fails open: if the
 * DB call throws, the request is allowed (and the error logged).
 */
export async function rateLimit(
  action: string,
  subject: string,
  { limit, windowSec }: RateLimitOptions,
): Promise<RateLimitResult> {
  const nowMs = Date.now();
  const windowMs = windowSec * 1000;
  const windowStart = Math.floor(nowMs / windowMs) * windowMs;
  const expiresAt = new Date(windowStart + windowMs);
  const key = `${action}:${subject}:${windowStart}`;

  try {
    const rows = await db.$queryRaw<{ count: number }[]>`
      INSERT INTO "RateLimit" ("key", "count", "expiresAt")
      VALUES (${key}, 1, ${expiresAt})
      ON CONFLICT ("key") DO UPDATE SET "count" = "RateLimit"."count" + 1
      RETURNING "count"`;
    const count = Number(rows[0]?.count ?? 1);

    // Opportunistic cleanup of expired windows (~1% of calls), not awaited.
    if (Math.random() < 0.01) {
      db.rateLimit
        .deleteMany({ where: { expiresAt: { lt: new Date() } } })
        .catch((e) => console.error("rateLimit cleanup failed", e));
    }

    if (count > limit) {
      return { ok: false, retryAfterSec: Math.max(1, Math.ceil((expiresAt.getTime() - nowMs) / 1000)) };
    }
    return { ok: true, remaining: limit - count };
  } catch (e) {
    console.error("rateLimit failed (allowing request)", e);
    return { ok: true, remaining: limit };
  }
}

/** Viewer id when signed in, else the client IP, else "anon". */
export async function rateLimitSubject(viewerId?: string | null): Promise<string> {
  if (viewerId) return `u:${viewerId}`;
  try {
    const h = await headers();
    const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip")?.trim();
    if (ip) return `ip:${ip}`;
  } catch {
    // headers() unavailable outside a request scope
  }
  return "anon";
}

/** Standard error result for a rate-limited action. */
export function rateLimitedResult(retryAfterSec: number) {
  return {
    ok: false as const,
    error: `Slow down — try again in ${retryAfterSec}s.`,
    code: "RATE_LIMITED" as const,
  };
}
