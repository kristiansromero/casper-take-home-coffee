import { z } from "zod";
import { beanSchema } from "@/lib/validation";

export const BREW_METHODS = ["espresso", "pour-over", "aeropress", "immersion"] as const;
export type BrewMethod = (typeof BREW_METHODS)[number];

export const METHOD_LABELS: Record<BrewMethod, string> = {
  espresso: "Espresso",
  "pour-over": "Pour-over",
  aeropress: "AeroPress",
  immersion: "Immersion",
};

const num = (label: string, min: number, max: number, unit: string) =>
  z
    .number({ error: `${label} is required` })
    .min(min, `${label} must be at least ${min}${unit}`)
    .max(max, `${label} must be at most ${max}${unit}`);

const optionalId = z
  .string()
  .nullish()
  .transform((v) => v || undefined);

/** Shared by the brew form (client) and createBrew (server). */
export const brewSchema = z.object({
  bean: beanSchema,
  method: z.enum(BREW_METHODS, { error: "Choose a brew method" }),
  brewerId: optionalId,
  grinderId: optionalId,
  doseG: num("Dose", 1, 100, " g"),
  yieldG: num("Yield", 1, 1000, " g"),
  grind: z.string().trim().min(1, "Grind setting is required").max(60),
  timeSec: num("Time", 1, 1800, " s").int("Time must be whole seconds"),
  tempC: num("Water temp", 70, 100, " °C"),
  rating: z
    .number()
    .int()
    .min(1)
    .max(5)
    .nullish()
    .transform((v) => v ?? undefined),
  flavorTags: z.array(z.string().min(1).max(120)).max(30, "Up to 30 flavor tags"),
  notes: z.string().trim().max(4000, "Notes must be 4000 characters or fewer").optional(),
});

export type BrewInput = z.input<typeof brewSchema>;
export type BrewData = z.output<typeof brewSchema>;

/** "2:45", "2m45", "165" or "165s" → seconds. NaN when unparseable. */
export function parseDuration(raw: string): number {
  const s = raw.trim();
  const mmss = s.match(/^(\d{1,2})\s*[:m]\s*(\d{1,2})\s*s?$/i);
  if (mmss) return Number(mmss[1]) * 60 + Number(mmss[2]);
  return /^\d+(\.\d+)?\s*s?$/i.test(s) ? Math.round(parseFloat(s)) : NaN;
}

export function formatDuration(sec: number) {
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;
}

export function formatRatio(doseG: number, yieldG: number) {
  if (!(doseG > 0) || !(yieldG > 0)) return "—";
  return `1:${(yieldG / doseG).toFixed(1).replace(/\.0$/, "")}`;
}
