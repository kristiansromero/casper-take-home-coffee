import { z } from "zod";
import { beanSchema } from "@/lib/validation";

/** Server-side contract for createRoast (times in seconds). */
export const roastSchema = z
  .object({
    bean: beanSchema,
    machineId: z.string().trim().optional().transform((v) => v || undefined),
    machineName: z.string().trim().min(1, "Machine is required").max(120),
    batchSizeG: z.coerce.number().min(50, "Min 50 g").max(20000, "Max 20 kg"),
    chargeTempC: z.coerce.number().min(100, "Min 100 °C").max(260, "Max 260 °C"),
    firstCrackSec: z.coerce.number().int().positive("Enter first crack time").max(3600, "First crack must be under 60 minutes"),
    dropSec: z.coerce.number().int().positive("Enter drop time").max(3600, "Drop must be under 60 minutes"),
    dropTempC: z.coerce.number().min(180, "Min 180 °C").max(250, "Max 250 °C"),
    flavorTags: z.array(z.string().trim().min(1)).max(30, "Up to 30 tags").default([]),
    notes: z.string().trim().max(4000).optional().transform((v) => v || undefined),
  })
  .refine((r) => r.dropSec > r.firstCrackSec, {
    message: "Drop must come after first crack",
    path: ["dropSec"],
  });

export type RoastInput = z.input<typeof roastSchema>;

export const PROCESS_OPTIONS = ["Washed", "Natural", "Honey", "Anaerobic", "Wet-hulled", "Carbonic maceration", "Other"];

/** "9:30" / "570" → seconds; NaN when unparseable. */
export function parseMmSs(v: string): number {
  const s = v.trim();
  if (/^\d+$/.test(s)) return Number(s);
  const m = /^(\d{1,2}):([0-5]\d)$/.exec(s);
  return m ? Number(m[1]) * 60 + Number(m[2]) : NaN;
}
