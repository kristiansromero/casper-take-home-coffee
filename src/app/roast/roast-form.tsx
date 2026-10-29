"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { FileUp, Flame, Loader2 } from "lucide-react";
import { createRoast } from "@/app/actions/roast";
import { FlavorTagPicker } from "@/components/flavor-tag-picker";
import { ProBadge } from "@/components/pro-badge";
import { RoastCurveChart } from "@/components/roast-curve-chart";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Input, Select, Textarea } from "@/components/ui/form-controls";
import { developmentPct, generateCurve } from "@/lib/mock-curve";
import { PROCESS_OPTIONS, parseMmSs } from "@/lib/roast-schema";
import { beanSchema } from "@/lib/validation";
import { cn } from "@/lib/utils";

const num = (label: string, min: number, max: number, unit: string) =>
  z
    .number({ error: `${label} is required` })
    .min(min, `Min ${min} ${unit}`)
    .max(max, `Max ${max} ${unit}`);

const mmss = z.string().refine((v) => parseMmSs(v) > 0, "Use mm:ss, e.g. 8:30");

const formSchema = z
  .object({
    bean: beanSchema,
    machineId: z.string(),
    machineName: z.string().trim().min(1, "Pick or name your roaster"),
    batchSizeG: num("Batch size", 50, 20000, "g"),
    chargeTempC: num("Charge temp", 100, 260, "°C"),
    firstCrack: mmss,
    drop: mmss,
    dropTempC: num("Drop temp", 180, 250, "°C"),
    flavorTags: z.array(z.string()).max(30, "Up to 30 tags"),
    notes: z.string().max(2000),
  })
  .refine((v) => parseMmSs(v.drop) > parseMmSs(v.firstCrack), {
    message: "Drop must come after first crack",
    path: ["drop"],
  });

type FormIn = z.input<typeof formSchema>;
type FormOut = z.output<typeof formSchema>;

export type RoasterOption = { id: string; name: string };

export function RoastForm({ roasters }: { roasters: RoasterOption[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    setError,
    formState: { errors },
  } = useForm<FormIn, unknown, FormOut>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      bean: { name: "", roaster: "", origin: "", varietal: "", process: "", elevation: "" },
      machineId: roasters[0]?.id ?? "",
      machineName: roasters[0]?.name ?? "",
      batchSizeG: 250,
      chargeTempC: 200,
      firstCrack: "8:30",
      drop: "10:15",
      dropTempC: 208,
      flavorTags: [],
      notes: "",
    },
  });

  const [machineId, chargeTempC, firstCrack, drop, dropTempC] = useWatch({
    control,
    name: ["machineId", "chargeTempC", "firstCrack", "drop", "dropTempC"],
  });

  const fcSec = parseMmSs(firstCrack ?? "");
  const dropSec = parseMmSs(drop ?? "");
  const timesValid = fcSec > 0 && dropSec > fcSec;

  const preview = useMemo(() => {
    if (!timesValid || !(chargeTempC >= 100) || !(dropTempC >= 180)) return null;
    return generateCurve({ chargeTempC, firstCrackSec: fcSec, dropSec, dropTempC, seed: 7 });
  }, [timesValid, chargeTempC, fcSec, dropSec, dropTempC]);

  const onSubmit = (v: FormOut) => {
    setServerError(null);
    startTransition(async () => {
      const res = await createRoast({
        bean: v.bean,
        machineId: v.machineId || undefined,
        machineName: v.machineName,
        batchSizeG: v.batchSizeG,
        chargeTempC: v.chargeTempC,
        firstCrackSec: parseMmSs(v.firstCrack),
        dropSec: parseMmSs(v.drop),
        dropTempC: v.dropTempC,
        flavorTags: v.flavorTags,
        notes: v.notes,
      });
      if (res.ok) {
        router.push(`/roast/${res.id}`);
        return;
      }
      setServerError(res.error);
      for (const [key, msgs] of Object.entries(res.fieldErrors ?? {})) {
        const field = key === "firstCrackSec" ? "firstCrack" : key === "dropSec" ? "drop" : key;
        if (msgs?.[0]) setError(field as keyof FormIn, { message: msgs[0] });
      }
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5" noValidate>
      <Card>
        <CardHeader>
          <CardTitle>Bean</CardTitle>
          <CardDescription>What went into the drum.</CardDescription>
        </CardHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name" required htmlFor="bean.name" error={errors.bean?.name?.message}>
            <Input id="bean.name" placeholder="Gesha Village Lot 74" aria-invalid={!!errors.bean?.name} {...register("bean.name")} />
          </Field>
          <Field label="Producer / Roaster" required htmlFor="bean.roaster" error={errors.bean?.roaster?.message}>
            <Input id="bean.roaster" placeholder="Gesha Village Estate" aria-invalid={!!errors.bean?.roaster} {...register("bean.roaster")} />
          </Field>
          <Field label="Origin" htmlFor="bean.origin">
            <Input id="bean.origin" placeholder="Bench Maji, Ethiopia" {...register("bean.origin")} />
          </Field>
          <Field label="Varietal" htmlFor="bean.varietal">
            <Input id="bean.varietal" placeholder="Gesha" {...register("bean.varietal")} />
          </Field>
          <Field label="Process" htmlFor="bean.process">
            <Select id="bean.process" {...register("bean.process")}>
              <option value="">—</option>
              {PROCESS_OPTIONS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Elevation" htmlFor="bean.elevation">
            <Input id="bean.elevation" placeholder="1,900–2,100 masl" {...register("bean.elevation")} />
          </Field>
        </div>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Machine</CardTitle>
        </CardHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          {roasters.length > 0 && (
            <Field label="Roaster" required htmlFor="machineId">
              <Select
                id="machineId"
                {...register("machineId", {
                  onChange: (e) => {
                    const match = roasters.find((r) => r.id === e.target.value);
                    setValue("machineName", match?.name ?? "", { shouldValidate: !!match });
                  },
                })}
              >
                {roasters.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
                <option value="">Other…</option>
              </Select>
            </Field>
          )}
          {(roasters.length === 0 || !machineId) && (
            <Field label="Machine name" required htmlFor="machineName" error={errors.machineName?.message}>
              <Input id="machineName" placeholder="Aillio Bullet R2" aria-invalid={!!errors.machineName} {...register("machineName")} />
            </Field>
          )}
          <Field label="Batch size (g)" required htmlFor="batchSizeG" error={errors.batchSizeG?.message}>
            <Input id="batchSizeG" type="number" inputMode="decimal" aria-invalid={!!errors.batchSizeG} {...register("batchSizeG", { valueAsNumber: true })} />
          </Field>
          <Field label="Charge temp (°C)" required htmlFor="chargeTempC" error={errors.chargeTempC?.message}>
            <Input id="chargeTempC" type="number" inputMode="decimal" aria-invalid={!!errors.chargeTempC} {...register("chargeTempC", { valueAsNumber: true })} />
          </Field>
        </div>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Milestones</CardTitle>
        </CardHeader>
        <div className="grid gap-4 sm:grid-cols-4">
          <Field label="First crack" required htmlFor="firstCrack" error={errors.firstCrack?.message}>
            <Input id="firstCrack" placeholder="mm:ss" className="font-mono" aria-invalid={!!errors.firstCrack} {...register("firstCrack")} />
          </Field>
          <Field label="Drop time" required htmlFor="drop" error={errors.drop?.message}>
            <Input id="drop" placeholder="mm:ss" className="font-mono" aria-invalid={!!errors.drop} {...register("drop")} />
          </Field>
          <Field label="Drop temp (°C)" required htmlFor="dropTempC" error={errors.dropTempC?.message}>
            <Input id="dropTempC" type="number" inputMode="decimal" aria-invalid={!!errors.dropTempC} {...register("dropTempC", { valueAsNumber: true })} />
          </Field>
          <div className="flex flex-col justify-end gap-1.5 rounded-xl border border-teal/30 bg-teal/10 px-4 py-2.5">
            <span className="text-xs font-medium uppercase tracking-wider text-teal-bright">Development</span>
            <span className="font-mono text-2xl text-sterile">{timesValid ? `${developmentPct(fcSec, dropSec)}%` : "—"}</span>
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Curve</CardTitle>
        </CardHeader>
        <div
          aria-disabled
          className="relative mb-5 flex cursor-not-allowed flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-line bg-obsidian/40 px-4 py-6 text-center opacity-80"
        >
          <ProBadge className="absolute right-3 top-3" />
          <FileUp className="size-6 text-muted" />
          <p className="text-sm text-sterile">Upload Artisan .alog curves — Pro feature</p>
          <p className="text-xs text-muted">Drop a logger export to replace the simulated curve.</p>
        </div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted">Simulated curve preview</p>
        {preview ? (
          <RoastCurveChart data={preview} firstCrackSec={fcSec} dropSec={dropSec} height={260} />
        ) : (
          <div className="flex h-[260px] items-center justify-center rounded-xl border border-line text-sm text-muted">
            Enter valid milestones to preview the curve.
          </div>
        )}
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Flavor</CardTitle>
        </CardHeader>
        <Controller
          control={control}
          name="flavorTags"
          render={({ field }) => <FlavorTagPicker value={field.value} onChange={field.onChange} />}
        />
        {errors.flavorTags?.message && <p className="mt-2 text-xs text-amber">{errors.flavorTags.message}</p>}
        <Field label="Notes" htmlFor="notes" className="mt-5">
          <Textarea id="notes" placeholder="Gas cut at 7:40, airflow up after FC…" {...register("notes")} />
        </Field>
      </Card>

      {serverError && <p className="rounded-lg border border-amber/40 bg-amber/10 px-3 py-2 text-sm text-amber">{serverError}</p>}

      <Button type="submit" size="lg" disabled={pending} className={cn("self-end", pending && "opacity-70")}>
        {pending ? <Loader2 className="animate-spin" /> : <Flame />}
        Log roast
      </Button>
    </form>
  );
}
