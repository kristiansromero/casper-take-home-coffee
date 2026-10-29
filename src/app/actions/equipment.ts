"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getViewer } from "@/lib/auth";
import { db } from "@/lib/db";
import { RATE_LIMITS, rateLimit, rateLimitSubject, rateLimitedResult } from "@/lib/rate-limit";

const EQUIPMENT_CATEGORIES = ["grinder", "brewer", "espresso", "roaster", "kettle", "scale"] as const;

const equipmentSchema = z.object({
  category: z.enum(EQUIPMENT_CATEGORIES, { error: "Pick a category" }),
  name: z.string().trim().min(1, "Name is required").max(80, "Keep it under 80 characters"),
  blurb: z.string().trim().max(280, "Keep it under 280 characters").optional(),
});

export type CreateEquipmentInput = { category: string; name: string; blurb?: string };

export type CreateEquipmentResult =
  | { ok: true; item: { id: string; name: string; category: string } }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]>; code?: "RATE_LIMITED" };

export async function createEquipment(input: CreateEquipmentInput): Promise<CreateEquipmentResult> {
  const parsed = equipmentSchema.safeParse(input);
  if (!parsed.success) {
    const flat = z.flattenError(parsed.error);
    const fieldErrors = flat.fieldErrors as Record<string, string[]>;
    const first = Object.values(fieldErrors).flat()[0];
    return { ok: false, error: first ?? "Please check the equipment details.", fieldErrors };
  }

  try {
    const viewer = await getViewer();
    if (!viewer) return { ok: false, error: "Sign in to add equipment." };
    const rl = await rateLimit("createEquipment", await rateLimitSubject(viewer.id), RATE_LIMITS.createEquipment);
    if (!rl.ok) return rateLimitedResult(rl.retryAfterSec);

    const { category, name, blurb } = parsed.data;
    const item = await db.equipment.create({
      data: { userId: viewer.id, category, name, blurb: blurb || null },
      select: { id: true, name: true, category: true },
    });

    revalidatePath("/brew");
    revalidatePath("/roast");
    revalidatePath(`/profile/${viewer.id}`);
    return { ok: true, item };
  } catch (e) {
    console.error("createEquipment failed", e);
    return { ok: false, error: "Could not save that equipment. Please try again." };
  }
}
