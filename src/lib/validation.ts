import { z } from "zod";

const optionalText = z
  .string()
  .trim()
  .max(120)
  .optional()
  .transform((v) => (v ? v : undefined));

export const beanSchema = z.object({
  name: z.string().trim().min(1, "Bean name is required").max(120),
  roaster: z.string().trim().min(1, "Producer / roaster is required").max(120),
  origin: optionalText,
  varietal: optionalText,
  process: optionalText,
  elevation: optionalText,
});

export type BeanInput = z.input<typeof beanSchema>;
