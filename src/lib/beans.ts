import "server-only";
import { db } from "@/lib/db";
import { beanSchema, type BeanInput } from "@/lib/validation";

/** Find-or-create the roaster and bean; fills in optional details on an existing bean. */
export async function upsertBean(input: BeanInput) {
  const { name, roaster, ...details } = beanSchema.parse(input);

  const roasterRow = await db.roaster.upsert({
    where: { name: roaster },
    update: {},
    create: { name: roaster },
  });

  return db.bean.upsert({
    where: { name_roasterId: { name, roasterId: roasterRow.id } },
    update: Object.fromEntries(Object.entries(details).filter(([, v]) => v !== undefined)),
    create: { name, roasterId: roasterRow.id, ...details },
  });
}
