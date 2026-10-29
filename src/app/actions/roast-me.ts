"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getViewer } from "@/lib/auth";
import { BENNY_MODEL, generateBennyProfile } from "@/lib/benny";
import { FREE_LIMIT, type BennyRun, type GenerateResult } from "@/app/roast-me/types";

const optionalText = z
  .string()
  .trim()
  .max(80)
  .optional()
  .transform((v) => v || undefined);

const toNum = (v: unknown) =>
  v === "" || v === null || v === undefined || (typeof v === "number" && Number.isNaN(v)) ? undefined : Number(v);

const inputSchema = z.object({
  beanName: z.string().trim().min(1, "Tell Benny which bean").max(120),
  origin: optionalText,
  process: optionalText,
  elevation: z.preprocess(toNum, z.number().min(0, "Elevation 0–3000 m").max(3000, "Elevation 0–3000 m").optional()),
  moisturePct: z.preprocess(toNum, z.number().min(8, "Moisture 8–14%").max(14, "Moisture 8–14%").optional()),
  machine: z
    .string()
    .trim()
    .max(80)
    .optional()
    .transform((v) => v || "Skywalker V2"),
  batchSizeG: z.preprocess(toNum, z.number().min(50, "Batch 50–1000 g").max(1000, "Batch 50–1000 g").default(250)),
  targetRoast: z.enum(["light", "medium", "medium-dark"]),
});

export type RoastMeInput = {
  beanName: string;
  origin?: string;
  process?: string;
  elevation?: number | string;
  moisturePct?: number | string;
  machine?: string;
  batchSizeG?: number | string;
  targetRoast: "light" | "medium" | "medium-dark";
};

export async function generateRoastProfile(raw: RoastMeInput): Promise<GenerateResult> {
  const parsed = inputSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) (fieldErrors[issue.path.join(".")] ??= []).push(issue.message);
    return { ok: false, code: "INVALID", error: "Some fields need attention.", fieldErrors };
  }
  const input = parsed.data;

  const viewer = await getViewer().catch(() => null);
  if (!viewer) return { ok: false, code: "AUTH", error: "Sign in to use Benny" };

  // Reserve a credit atomically so concurrent submits can't exceed the free limit.
  if (!viewer.isPro) {
    const { count } = await db.user.updateMany({
      where: { id: viewer.id, aiUsageCount: { lt: FREE_LIMIT } },
      data: { aiUsageCount: { increment: 1 } },
    });
    if (count === 0) {
      return {
        ok: false,
        code: "LIMIT",
        error: `You've used all ${FREE_LIMIT} free Benny generations. Upgrade to Pro for unlimited profiles.`,
      };
    }
  }
  const refund = async () => {
    if (viewer.isPro) return;
    await db.user
      .updateMany({ where: { id: viewer.id, aiUsageCount: { gt: 0 } }, data: { aiUsageCount: { decrement: 1 } } })
      .catch((e) => console.error("Benny credit refund failed", e));
  };

  if (!process.env.ANTHROPIC_API_KEY) {
    await refund();
    return { ok: false, code: "OFFLINE", error: "Benny is offline — ANTHROPIC_API_KEY not configured" };
  }

  try {
    const { result, grounding } = await generateBennyProfile(input);
    const groundedOn = grounding.map((g) => ({ id: g.id, beanName: g.beanName, process: g.process }));

    const run = await db.roastMeRun.create({
      data: { userId: viewer.id, input, output: { ...result, groundedOn }, model: BENNY_MODEL },
      select: { id: true, createdAt: true, user: { select: { aiUsageCount: true } } },
    });

    revalidatePath("/roast-me");
    const payload: BennyRun = {
      id: run.id,
      createdAt: run.createdAt.toISOString(),
      input,
      output: result,
      groundedOn,
    };
    return {
      ok: true,
      run: payload,
      creditsLeft: viewer.isPro ? null : Math.max(0, FREE_LIMIT - run.user.aiUsageCount),
    };
  } catch (err) {
    console.error("generateRoastProfile failed", err);
    await refund();
    return {
      ok: false,
      code: "ERROR",
      error: "Benny couldn't finish this profile. Your credit was refunded, please try again.",
    };
  }
}
