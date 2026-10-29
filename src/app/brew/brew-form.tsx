"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm, type FieldPath } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AlertTriangle, Loader2, Star } from "lucide-react";
import { createBrew } from "@/app/actions/brew";
import { FlavorWheelPicker, notesToPaths, pathsToNotes } from "@/components/flavor-wheel-picker";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EquipmentSelect } from "@/components/equipment-select";
import { NotesEditor } from "@/components/notes-editor";
import { Field, Input, Select } from "@/components/ui/form-controls";
import { cn } from "@/lib/utils";
import { BREW_METHODS, METHOD_LABELS, brewSchema, formatRatio, parseDuration } from "./schema";

const PROCESSES = ["Washed", "Natural", "Honey", "Anaerobic", "Wet-hulled", "Other"];

// The form takes a free-text time ("2:45" or "165") and converts it to seconds on submit.
const formSchema = brewSchema.omit({ timeSec: true }).extend({
  time: z
    .string()
    .trim()
    .min(1, "Time is required")
    .refine((v) => {
      const s = parseDuration(v);
      return Number.isInteger(s) && s >= 1 && s <= 1800;
    }, "Use mm:ss or seconds, up to 30:00"),
});

type FormIn = z.input<typeof formSchema>;
type FormOut = z.output<typeof formSchema>;

export type EquipmentOption = { id: string; name: string; category: string };

export function BrewForm({ brewers, grinders }: { brewers: EquipmentOption[]; grinders: EquipmentOption[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setError,
    formState: { errors },
  } = useForm<FormIn, unknown, FormOut>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      bean: { name: "", roaster: "", origin: "", varietal: "", process: "", elevation: "" },
      method: "pour-over",
      brewerId: "",
      grinderId: "",
      grind: "",
      time: "",
      tempC: 94,
      rating: null,
      flavorTags: [],
      notes: "",
    },
  });

  const [method, doseG, yieldG] = watch(["method", "doseG", "yieldG"]);
  const ratio = formatRatio(Number(doseG), Number(yieldG));

  const onSubmit = ({ time, ...values }: FormOut) => {
    setServerError(null);
    startTransition(async () => {
      const result = await createBrew({ ...values, timeSec: parseDuration(time) });
      if (result.ok) {
        router.push(`/brew/${result.id}`);
        return;
      }
      setServerError(result.error);
      for (const [path, messages] of Object.entries(result.fieldErrors ?? {})) {
        const name = (path === "timeSec" ? "time" : path) as FieldPath<FormIn>;
        setError(name, { message: messages[0] });
      }
    });
  };

  const num = { valueAsNumber: true } as const;

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
      <Card>
        <CardHeader>
          <CardTitle>Bean</CardTitle>
          <CardDescription>Matched to an existing bean by name and roaster, or created new.</CardDescription>
        </CardHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name" required htmlFor="bean.name" error={errors.bean?.name?.message}>
            <Input id="bean.name" placeholder="Gesha Village Lot 74" aria-invalid={!!errors.bean?.name} {...register("bean.name")} />
          </Field>
          <Field label="Producer / Roaster" required htmlFor="bean.roaster" error={errors.bean?.roaster?.message}>
            <Input id="bean.roaster" placeholder="Onyx Coffee Lab" aria-invalid={!!errors.bean?.roaster} {...register("bean.roaster")} />
          </Field>
          <Field label="Origin" htmlFor="bean.origin" error={errors.bean?.origin?.message}>
            <Input id="bean.origin" placeholder="Bench Maji, Ethiopia" {...register("bean.origin")} />
          </Field>
          <Field label="Varietal" htmlFor="bean.varietal" error={errors.bean?.varietal?.message}>
            <Input id="bean.varietal" placeholder="Gesha" {...register("bean.varietal")} />
          </Field>
          <Field label="Process" htmlFor="bean.process" error={errors.bean?.process?.message}>
            <Select id="bean.process" {...register("bean.process")}>
              <option value="">—</option>
              {PROCESSES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Elevation" htmlFor="bean.elevation" error={errors.bean?.elevation?.message}>
            <Input id="bean.elevation" placeholder="1,900 masl" {...register("bean.elevation")} />
          </Field>
        </div>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Extraction</CardTitle>
          <CardDescription>Parameters for this cup.</CardDescription>
        </CardHeader>
        <div className="flex flex-col gap-4">
          <Controller
            control={control}
            name="method"
            render={({ field }) => (
              <div role="radiogroup" aria-label="Brew method" className="grid grid-cols-2 gap-1 rounded-xl border border-line bg-obsidian/60 p-1 sm:grid-cols-4">
                {BREW_METHODS.map((m) => (
                  <button
                    key={m}
                    type="button"
                    role="radio"
                    aria-checked={field.value === m}
                    onClick={() => field.onChange(m)}
                    className={cn(
                      "h-9 rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal/60",
                      field.value === m ? "bg-teal text-obsidian" : "text-muted hover:bg-titanium-2 hover:text-sterile",
                    )}
                  >
                    {METHOD_LABELS[m]}
                  </button>
                ))}
              </div>
            )}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label={method === "espresso" ? "Machine" : "Brewer"}
              htmlFor="brewerId"
              hint={brewers.length ? undefined : "Pick “+ Add new equipment…” to add your gear."}
            >
              <Controller
                control={control}
                name="brewerId"
                render={({ field }) => (
                  <EquipmentSelect
                    id="brewerId"
                    value={field.value ?? ""}
                    onChange={(v) => field.onChange(v)}
                    options={brewers}
                    categories={method === "espresso" ? ["espresso", "brewer"] : ["brewer", "espresso"]}
                    label={method === "espresso" ? "machine" : "brewer"}
                  />
                )}
              />
            </Field>
            <Field label="Grinder" htmlFor="grinderId">
              <Controller
                control={control}
                name="grinderId"
                render={({ field }) => (
                  <EquipmentSelect
                    id="grinderId"
                    value={field.value ?? ""}
                    onChange={(v) => field.onChange(v)}
                    options={grinders}
                    categories={["grinder"]}
                    label="grinder"
                  />
                )}
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <Field label="Dose (g)" required htmlFor="doseG" error={errors.doseG?.message}>
              <Input id="doseG" type="number" inputMode="decimal" step="0.1" placeholder="18" aria-invalid={!!errors.doseG} {...register("doseG", num)} />
            </Field>
            <Field label="Yield (g)" required htmlFor="yieldG" error={errors.yieldG?.message}>
              <Input id="yieldG" type="number" inputMode="decimal" step="0.1" placeholder={method === "espresso" ? "36" : "300"} aria-invalid={!!errors.yieldG} {...register("yieldG", num)} />
            </Field>
            <div className="col-span-2 flex flex-col justify-center rounded-xl border border-teal/30 bg-teal/10 px-4 py-2 sm:col-span-1">
              <span className="text-[11px] font-medium uppercase tracking-wider text-muted">Brew ratio</span>
              <span className="font-mono text-2xl tabular-nums text-teal-bright" aria-live="polite">
                {ratio}
              </span>
            </div>
            <Field label="Grind" required htmlFor="grind" error={errors.grind?.message}>
              <Input id="grind" placeholder="EK 8.5 / 1.2" aria-invalid={!!errors.grind} {...register("grind")} />
            </Field>
            <Field label="Time" required htmlFor="time" error={errors.time?.message} hint="mm:ss or seconds">
              <Input id="time" inputMode="numeric" placeholder={method === "espresso" ? "0:28" : "3:10"} aria-invalid={!!errors.time} {...register("time")} />
            </Field>
            <Field label="Water °C" required htmlFor="tempC" error={errors.tempC?.message}>
              <Input id="tempC" type="number" inputMode="decimal" step="0.5" aria-invalid={!!errors.tempC} {...register("tempC", num)} />
            </Field>
          </div>

          <Field label="Rating" error={errors.rating?.message}>
            <Controller
              control={control}
              name="rating"
              render={({ field }) => <StarRating value={field.value ?? null} onChange={field.onChange} />}
            />
          </Field>
        </div>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Flavor</CardTitle>
          <CardDescription>Tag what you taste using the SCA Coffee Taster&apos;s Flavor Wheel.</CardDescription>
        </CardHeader>
        <Controller
          control={control}
          name="flavorTags"
          render={({ field }) => <FlavorWheelPicker value={pathsToNotes(field.value)} onChange={(notes) => field.onChange(notesToPaths(notes))} />}
        />
        {errors.flavorTags && <p className="mt-2 text-xs text-amber">{errors.flavorTags.message}</p>}
        <Field label="Notes" htmlFor="notes" error={errors.notes?.message} className="mt-5">
          <Controller
            control={control}
            name="notes"
            render={({ field }) => (
              <NotesEditor
                id="notes"
                value={field.value ?? ""}
                onChange={field.onChange}
                placeholder="Bright, juicy acidity; long cocoa finish…"
              />
            )}
          />
        </Field>
      </Card>

      {serverError && (
        <div role="alert" className="flex items-center gap-2 rounded-xl border border-amber/40 bg-amber/10 px-4 py-3 text-sm text-amber">
          <AlertTriangle className="size-4 shrink-0" aria-hidden />
          {serverError}
        </div>
      )}

      <div className="flex justify-end">
        <Button type="submit" size="lg" disabled={pending} className="w-full sm:w-auto">
          {pending && <Loader2 className="animate-spin" aria-hidden />}
          {pending ? "Saving…" : "Log extraction"}
        </Button>
      </div>
    </form>
  );
}

function StarRating({ value, onChange }: { value: number | null; onChange: (v: number | null) => void }) {
  return (
    <div role="radiogroup" aria-label="Rating" className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} star${n > 1 ? "s" : ""}`}
          onClick={() => onChange(value === n ? null : n)}
          className="rounded p-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal/60"
        >
          <Star className={cn("size-6 transition-colors", value && n <= value ? "fill-amber text-amber" : "text-line hover:text-muted")} />
        </button>
      ))}
      {value && (
        <button type="button" onClick={() => onChange(null)} className="ml-2 text-xs text-muted hover:text-sterile">
          Clear
        </button>
      )}
    </div>
  );
}
