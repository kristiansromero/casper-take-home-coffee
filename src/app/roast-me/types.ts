import type { CurvePoint } from "@/lib/mock-curve";

export const FREE_LIMIT = 3;

export type BennyMilestones = {
  chargeTempC: number;
  dryEndSec: number;
  firstCrackSec: number;
  dropSec: number;
  dropTempC: number;
  developmentPct: number;
};

export type BennyOutput = {
  headline: string;
  strategyMarkdown: string;
  milestones: BennyMilestones;
  expectedNotes: string[];
  curve: CurvePoint[];
};

export type GroundedOn = { id: string; beanName: string; process: string | null };

export type BennyRunInput = {
  beanName: string;
  origin?: string;
  process?: string;
  elevation?: number;
  moisturePct?: number;
  machine: string;
  batchSizeG: number;
  targetRoast: string;
};

export type BennyRun = {
  id: string;
  createdAt: string;
  input: BennyRunInput;
  output: BennyOutput;
  groundedOn: GroundedOn[];
};

export type GenerateResult =
  | { ok: true; run: BennyRun; creditsLeft: number | null }
  | {
      ok: false;
      code?: "LIMIT" | "OFFLINE" | "AUTH" | "INVALID" | "ERROR";
      error: string;
      fieldErrors?: Record<string, string[]>;
    };
