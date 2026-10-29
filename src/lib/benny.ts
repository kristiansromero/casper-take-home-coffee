import "server-only";
import { z } from "zod";
import { generateText, Output } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { db } from "@/lib/db";
import { developmentPct, type CurvePoint } from "@/lib/mock-curve";

export const BENNY_MODEL = "claude-sonnet-5-5";

export const BENNY_SYSTEM_PROMPT = `You are Benny, BeanWater's AI Coffee SME: an elite Master Roaster, licensed Q Grader, and thermal-dynamics expert who has profiled thousands of specialty lots on small-batch roasters.

Voice: precise, warm, encouraging. Speak to a passionate home roaster as a mentor would. Use concrete numbers (°C, mm:ss, % development, °C/min RoR) and explain the *why* in terms of heat transfer, bean density, moisture, and Maillard/caramelization chemistry. Never pad.

Machine knowledge: the Skywalker V2 is a small (~250 g max) electric drum roaster with fluid-bed-like convective behaviour at small batch sizes; it has modest thermal mass, responds quickly to heat/fan changes, and benefits from a confident charge and an early, gradual heat reduction to keep a smoothly declining rate of rise (avoid flicks and crashes after first crack). Typical total roast 8–12 minutes. First crack begins around 195–200 °C bean temperature.

Grounding: you will be given a handful of community roasts from BeanWater that are similar to the user's bean. Use them as evidence (cite what worked), but adapt to the user's batch size, moisture and target roast level. Do not invent community data.

Output rules:
- strategyMarkdown: GitHub-flavored markdown with short "##" sections covering charge temp, drying phase, Maillard phase, first-crack target, drop temp and development %, expected flavor notes, and what to watch for. No raw HTML.
- milestones must be internally consistent with the curve: developmentPct = (dropSec - firstCrackSec) / dropSec * 100.
- expectedNotes: 3–6 SCA flavor wheel terms (e.g. "Blueberry", "Jasmine", "Milk Chocolate", "Brown Sugar").
- curve: one point every 15 seconds from 0 (charge) to dropSec inclusive. beanTemperature dips from charge to a turning point (~80–100 °C) near 60–100 s, then rises with a smoothly declining RoR. environmentalTemperature stays above bean temperature. All temps in °C.`;

const curvePointSchema = z.object({
  elapsedSeconds: z.number(),
  beanTemperature: z.number(),
  environmentalTemperature: z.number(),
});

export const bennyOutputSchema = z.object({
  headline: z.string().describe("One-sentence summary of the roast plan"),
  strategyMarkdown: z.string(),
  milestones: z.object({
    chargeTempC: z.number(),
    dryEndSec: z.number(),
    firstCrackSec: z.number(),
    dropSec: z.number(),
    dropTempC: z.number(),
    developmentPct: z.number(),
  }),
  expectedNotes: z.array(z.string()),
  curve: z.array(curvePointSchema),
});

export type BennyRawOutput = z.infer<typeof bennyOutputSchema>;

export type BennyInput = {
  beanName: string;
  origin?: string;
  process?: string;
  elevation?: number;
  moisturePct?: number;
  machine: string;
  batchSizeG: number;
  targetRoast: "light" | "medium" | "medium-dark";
};

/** What we store in RoastMeRun.output and send to the client. */
export type BennyResult = Omit<BennyRawOutput, "curve"> & { curve: CurvePoint[] };

export type GroundingRoast = {
  id: string;
  beanName: string;
  origin: string | null;
  process: string | null;
  elevation: string | null;
  chargeTempC: number;
  firstCrackSec: number;
  dropSec: number;
  dropTempC: number;
  developmentPct: number;
  flavorTags: string[];
  score: number;
};

const norm = (s?: string | null) => (s ?? "").trim().toLowerCase();

/** "1,900–2,100 m" → 2000; "1800" → 1800. */
export function parseElevation(s?: string | null): number | null {
  if (!s) return null;
  const nums = s.replace(/,/g, "").match(/\d{3,4}/g)?.map(Number) ?? [];
  if (!nums.length) return null;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function looselyEqual(a: string, b: string) {
  if (!a || !b) return false;
  return a === b || a.includes(b) || b.includes(a);
}

/**
 * Score recent community roasts against the input: same process +2, same origin +2,
 * elevation within 300 m +1. Returns up to `limit` best matches with score > 0
 * (falls back to the most recent roasts if nothing matches).
 */
export async function findSimilarRoasts(input: BennyInput, limit = 5): Promise<GroundingRoast[]> {
  const roasts = await db.roast.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    select: {
      id: true,
      chargeTempC: true,
      firstCrackSec: true,
      dropSec: true,
      dropTempC: true,
      flavorTags: true,
      bean: { select: { name: true, origin: true, process: true, elevation: true } },
    },
  });

  const inProcess = norm(input.process);
  const inOrigin = norm(input.origin);
  const inElev = input.elevation ?? null;

  const scored = roasts.map((r) => {
    let score = 0;
    if (looselyEqual(inProcess, norm(r.bean.process))) score += 2;
    if (looselyEqual(inOrigin, norm(r.bean.origin))) score += 2;
    const elev = parseElevation(r.bean.elevation);
    if (inElev != null && elev != null && Math.abs(inElev - elev) <= 300) score += 1;
    return {
      id: r.id,
      beanName: r.bean.name,
      origin: r.bean.origin,
      process: r.bean.process,
      elevation: r.bean.elevation,
      chargeTempC: r.chargeTempC,
      firstCrackSec: r.firstCrackSec,
      dropSec: r.dropSec,
      dropTempC: r.dropTempC,
      developmentPct: developmentPct(r.firstCrackSec, r.dropSec),
      flavorTags: r.flavorTags,
      score,
    };
  });

  const matches = scored.filter((r) => r.score > 0).sort((a, b) => b.score - a.score);
  return (matches.length ? matches : scored).slice(0, limit);
}

function buildPrompt(input: BennyInput, grounding: GroundingRoast[]) {
  const bean = [
    `Bean: ${input.beanName}`,
    input.origin && `Origin: ${input.origin}`,
    input.process && `Process: ${input.process}`,
    input.elevation != null && `Elevation: ${input.elevation} m`,
    input.moisturePct != null && `Moisture: ${input.moisturePct}%`,
    `Machine: ${input.machine}`,
    `Batch size: ${input.batchSizeG} g`,
    `Target roast level: ${input.targetRoast}`,
  ]
    .filter(Boolean)
    .join("\n");

  const community = grounding.length
    ? grounding
        .map(
          (r, i) =>
            `${i + 1}. ${r.beanName} (${[r.origin, r.process, r.elevation].filter(Boolean).join(", ") || "no metadata"}) — charge ${r.chargeTempC} °C, FC ${r.firstCrackSec}s, drop ${r.dropSec}s @ ${r.dropTempC} °C, dev ${r.developmentPct}%, flavors: ${r.flavorTags.join(", ") || "none"}`,
        )
        .join("\n")
    : "No community roasts available.";

  return `Design a roast profile for this coffee.\n\n${bean}\n\nSimilar community roasts on BeanWater (most similar first):\n${community}`;
}

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));
const r1 = (n: number) => Math.round(n * 10) / 10;

/** Sort, dedupe, clamp, and convert Benny's curve into chart-ready CurvePoints with a 30s-window RoR. */
export function sanitizeCurve(raw: BennyRawOutput["curve"], dropSec?: number): CurvePoint[] {
  const seen = new Set<number>();
  const pts = raw
    .filter(
      (p) =>
        Number.isFinite(p.elapsedSeconds) &&
        Number.isFinite(p.beanTemperature) &&
        Number.isFinite(p.environmentalTemperature) &&
        p.elapsedSeconds >= 0 &&
        (dropSec == null || p.elapsedSeconds <= dropSec + 15),
    )
    .sort((a, b) => a.elapsedSeconds - b.elapsedSeconds)
    .filter((p) => {
      const t = Math.round(p.elapsedSeconds);
      if (seen.has(t)) return false;
      seen.add(t);
      return true;
    })
    .map<CurvePoint>((p) => ({
      t: Math.round(p.elapsedSeconds),
      bt: r1(clamp(p.beanTemperature, 20, 260)),
      et: r1(clamp(p.environmentalTemperature, 20, 260)),
      ror: null,
    }));

  // Turning point = min BT; RoR is meaningless before it.
  const tp = pts.reduce((min, p) => (p.bt < min.bt ? p : min), pts[0]);
  for (let i = 1; i < pts.length; i++) {
    let j = i;
    while (j > 0 && pts[i].t - pts[j - 1].t <= 30) j--;
    if (j === i || pts[j].t <= (tp?.t ?? 0)) continue;
    const dt = pts[i].t - pts[j].t;
    pts[i].ror = r1(((pts[i].bt - pts[j].bt) / dt) * 60);
  }
  return pts;
}

/** Call the model, validate, and normalize. Throws on model/validation failure. */
export async function generateBennyProfile(input: BennyInput) {
  const grounding = await findSimilarRoasts(input);

  const { output } = await generateText({
    model: anthropic(BENNY_MODEL),
    system: BENNY_SYSTEM_PROMPT,
    prompt: buildPrompt(input, grounding),
    output: Output.object({ schema: bennyOutputSchema, name: "roast_profile" }),
    maxRetries: 1,
  });

  const parsed = bennyOutputSchema.parse(output);
  const m = parsed.milestones;
  const dropSec = Math.round(clamp(m.dropSec, 240, 1200));
  const firstCrackSec = Math.round(clamp(m.firstCrackSec, 120, dropSec - 15));
  const curve = sanitizeCurve(parsed.curve, dropSec);
  if (curve.length < 8) throw new Error("Benny returned an incomplete curve.");

  const result: BennyResult = {
    headline: parsed.headline,
    strategyMarkdown: parsed.strategyMarkdown,
    milestones: {
      chargeTempC: r1(clamp(m.chargeTempC, 20, 260)),
      dryEndSec: Math.round(clamp(m.dryEndSec, 0, firstCrackSec)),
      firstCrackSec,
      dropSec,
      dropTempC: r1(clamp(m.dropTempC, 20, 260)),
      developmentPct: developmentPct(firstCrackSec, dropSec),
    },
    expectedNotes: parsed.expectedNotes.slice(0, 8),
    curve,
  };

  return { result, grounding };
}
