"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireViewer } from "@/lib/auth";
import { upsertBean } from "@/lib/beans";
import { db } from "@/lib/db";
import { generateCurve } from "@/lib/mock-curve";
import { roastSchema, type RoastInput } from "@/lib/roast-schema";

export type CreateRoastResult =
  | { ok: true; id: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

export async function createRoast(input: RoastInput): Promise<CreateRoastResult> {
  const parsed = roastSchema.safeParse(input);
  if (!parsed.success) {
    const flat = z.flattenError(parsed.error);
    return { ok: false, error: "Please fix the highlighted fields.", fieldErrors: flat.fieldErrors as Record<string, string[]> };
  }

  try {
    const viewer = await requireViewer();
    const { bean: beanInput, machineId, ...r } = parsed.data;
    const bean = await upsertBean(beanInput);

    // Only link equipment the viewer actually owns.
    const machine = machineId
      ? await db.equipment.findFirst({ where: { id: machineId, userId: viewer.id, category: "roaster" } })
      : null;

    const curve = generateCurve({
      chargeTempC: r.chargeTempC,
      firstCrackSec: r.firstCrackSec,
      dropSec: r.dropSec,
      dropTempC: r.dropTempC,
      seed: Date.now(),
    });

    const roast = await db.roast.create({
      data: {
        userId: viewer.id,
        beanId: bean.id,
        machineId: machine?.id,
        machineName: machine?.name ?? r.machineName,
        batchSizeG: r.batchSizeG,
        chargeTempC: r.chargeTempC,
        firstCrackSec: r.firstCrackSec,
        dropSec: r.dropSec,
        dropTempC: r.dropTempC,
        flavorTags: r.flavorTags,
        notes: r.notes,
        curve,
      },
    });

    revalidatePath("/");
    return { ok: true, id: roast.id };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Could not save roast." };
  }
}
