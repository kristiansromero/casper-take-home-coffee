"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, History, PlugZap, Sparkles } from "lucide-react";
import { generateRoastProfile, type RoastMeInput } from "@/app/actions/roast-me";
import { BennyAvatar } from "@/components/benny-avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input, Select } from "@/components/ui/form-controls";
import { Tooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { BennyResult } from "./benny-result";
import { FREE_LIMIT, type BennyRun, type GenerateResult } from "./types";

type FormState = {
  beanName: string;
  origin: string;
  process: string;
  elevation: string;
  moisturePct: string;
  machine: string;
  batchSizeG: string;
  targetRoast: RoastMeInput["targetRoast"];
};

const INITIAL: FormState = {
  beanName: "",
  origin: "",
  process: "",
  elevation: "",
  moisturePct: "",
  machine: "Skywalker V2",
  batchSizeG: "250",
  targetRoast: "light",
};

export function CreditMeter({ creditsLeft, isPro }: { creditsLeft: number; isPro: boolean }) {
  if (isPro) {
    return (
      <p className="inline-flex items-center gap-2 rounded-full border border-amber/40 bg-amber/10 px-3 py-1 text-xs font-medium text-amber">
        <Sparkles className="size-3.5" /> Pro · unlimited generations
      </p>
    );
  }
  return (
    <div className="flex items-center gap-3" role="status" aria-label={`${creditsLeft} of ${FREE_LIMIT} free generations left`}>
      <div className="flex gap-1.5" aria-hidden>
        {Array.from({ length: FREE_LIMIT }, (_, i) => (
          <span
            key={i}
            className={cn(
              "h-2 w-6 rounded-full transition-colors",
              i < creditsLeft ? "bg-teal-bright shadow-[0_0_8px_rgba(71,145,143,0.8)]" : "bg-line",
            )}
          />
        ))}
      </div>
      <span className={cn("text-xs", creditsLeft === 0 ? "text-amber" : "text-muted")}>
        {creditsLeft} of {FREE_LIMIT} free generations left
      </span>
    </div>
  );
}

export function UpgradeCard() {
  return (
    <Card className="flex flex-col gap-3 border-amber/40 bg-amber/[0.06]">
      <p className="flex items-center gap-2 font-semibold text-amber">
        <Sparkles className="size-4" /> You&apos;ve used your free Benny generations
      </p>
      <p className="text-sm text-sterile/80">
        Pro unlocks unlimited AI roast profiles, .alog curve uploads, and priority access to new Benny skills.
      </p>
      <Tooltip content="Billing not enabled in this demo">
        <Button type="button" variant="amber" aria-disabled="true" className="w-fit cursor-not-allowed">
          <Sparkles /> Upgrade to Pro
        </Button>
      </Tooltip>
    </Card>
  );
}

function Thinking() {
  return (
    <Card className="flex flex-col gap-4" aria-live="polite" aria-busy="true">
      <div className="flex items-center gap-3">
        <BennyAvatar size="sm" className="animate-pulse" />
        <p className="text-sm font-medium text-sterile">Benny is profiling your beans…</p>
      </div>
      <div className="space-y-2">
        {[85, 60, 72].map((w, i) => (
          <div key={i} className="h-3 animate-pulse rounded bg-titanium-2" style={{ width: `${w}%`, animationDelay: `${i * 120}ms` }} />
        ))}
      </div>
      <div className="grid grid-cols-5 gap-2">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="h-12 animate-pulse rounded-lg bg-titanium-2/70" style={{ animationDelay: `${i * 80}ms` }} />
        ))}
      </div>
      <div className="h-56 animate-pulse rounded-xl bg-titanium-2/50" />
      <p className="text-xs text-muted">Reading community roasts, modelling heat transfer, plotting your curve. ~20–40 s.</p>
    </Card>
  );
}

export function BennyWorkspace({
  initialCreditsLeft,
  isPro,
  pastRuns,
}: {
  initialCreditsLeft: number;
  isPro: boolean;
  pastRuns: BennyRun[];
}) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(INITIAL);
  const [creditsLeft, setCreditsLeft] = useState(initialCreditsLeft);
  const [error, setError] = useState<Extract<GenerateResult, { ok: false }> | null>(null);
  const [run, setRun] = useState<BennyRun | null>(pastRuns[0] ?? null);
  const [pending, startTransition] = useTransition();

  const exhausted = !isPro && creditsLeft <= 0;
  const set = <K extends keyof FormState>(k: K) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));
  const fe = (k: string) => (error?.fieldErrors?.[k]?.[0] ? error.fieldErrors[k][0] : undefined);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (exhausted || pending) return;
    setError(null);
    startTransition(async () => {
      const res = await generateRoastProfile(form);
      if (res.ok) {
        setRun(res.run);
        if (res.creditsLeft != null) setCreditsLeft(res.creditsLeft);
        router.refresh();
      } else {
        setError(res);
        if (res.code === "LIMIT") setCreditsLeft(0);
      }
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
      <div className="flex flex-col gap-4">
        <Card className="flex flex-col gap-4">
          <CreditMeter creditsLeft={creditsLeft} isPro={isPro} />
          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <fieldset disabled={exhausted || pending} className="flex flex-col gap-4 disabled:opacity-60">
              <Field label="Bean" required htmlFor="beanName" error={fe("beanName")}>
                <Input
                  id="beanName"
                  required
                  value={form.beanName}
                  onChange={set("beanName")}
                  placeholder="Ethiopia Guji Hambela"
                  aria-invalid={!!fe("beanName")}
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Origin" htmlFor="origin" error={fe("origin")}>
                  <Input id="origin" value={form.origin} onChange={set("origin")} placeholder="Ethiopia" />
                </Field>
                <Field label="Process" htmlFor="process" error={fe("process")}>
                  <Select id="process" value={form.process} onChange={set("process")}>
                    <option value="">—</option>
                    <option>Washed</option>
                    <option>Natural</option>
                    <option>Honey</option>
                    <option>Anaerobic</option>
                    <option>Wet-hulled</option>
                  </Select>
                </Field>
                <Field label="Elevation (m)" htmlFor="elevation" error={fe("elevation")}>
                  <Input id="elevation" type="number" inputMode="numeric" min={0} max={3000} value={form.elevation} onChange={set("elevation")} placeholder="2100" />
                </Field>
                <Field label="Moisture %" htmlFor="moisturePct" error={fe("moisturePct")}>
                  <Input id="moisturePct" type="number" step="0.1" min={8} max={14} value={form.moisturePct} onChange={set("moisturePct")} placeholder="10.5" />
                </Field>
                <Field label="Machine" required htmlFor="machine" error={fe("machine")}>
                  <Input id="machine" value={form.machine} onChange={set("machine")} />
                </Field>
                <Field label="Batch (g)" required htmlFor="batchSizeG" error={fe("batchSizeG")}>
                  <Input id="batchSizeG" type="number" min={50} max={1000} value={form.batchSizeG} onChange={set("batchSizeG")} />
                </Field>
              </div>
              <Field label="Target roast" required htmlFor="targetRoast" error={fe("targetRoast")}>
                <Select id="targetRoast" value={form.targetRoast} onChange={set("targetRoast")}>
                  <option value="light">Light (filter)</option>
                  <option value="medium">Medium (omni)</option>
                  <option value="medium-dark">Medium-dark (espresso)</option>
                </Select>
              </Field>
              <Button type="submit" disabled={exhausted || pending || !form.beanName.trim()}>
                <Sparkles /> {pending ? "Benny is thinking…" : "Ask Benny for a profile"}
              </Button>
            </fieldset>
          </form>
        </Card>

        {exhausted && <UpgradeCard />}

        {pastRuns.length > 0 && (
          <Card className="flex flex-col gap-2">
            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-muted">
              <History className="size-3.5" /> Your recent profiles
            </p>
            <ul className="flex flex-col gap-1">
              {pastRuns.map((r) => (
                <li key={r.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setRun(r);
                      setError(null);
                    }}
                    className={cn(
                      "w-full rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-titanium-2",
                      run?.id === r.id ? "bg-titanium-2 text-sterile" : "text-sterile/80",
                    )}
                  >
                    <span className="block truncate font-medium">{r.input.beanName}</span>
                    <span className="block text-xs text-muted">
                      {r.input.targetRoast} · {new Date(r.createdAt).toLocaleDateString()}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>

      <div className="flex min-w-0 flex-col gap-4">
        {error && <ErrorBanner error={error} />}
        {pending ? (
          <Thinking />
        ) : run ? (
          <BennyResult key={run.id} run={run} />
        ) : (
          <Card className="flex min-h-64 flex-col items-center justify-center gap-3 text-center">
            <BennyAvatar size="lg" />
            <p className="max-w-sm text-sm text-muted">
              Tell Benny about your green coffee. You&apos;ll get a target curve, milestones, flavor expectations and a
              step-by-step strategy grounded in roasts from the BeanWater community.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}

function ErrorBanner({ error }: { error: Extract<GenerateResult, { ok: false }> }) {
  const offline = error.code === "OFFLINE";
  const Icon = offline ? PlugZap : AlertTriangle;
  return (
    <div
      role="alert"
      className={cn(
        "flex items-start gap-3 rounded-xl border px-4 py-3 text-sm",
        offline ? "border-line bg-titanium-2/60 text-sterile/85" : "border-amber/40 bg-amber/10 text-amber",
      )}
    >
      <Icon className="mt-0.5 size-4 shrink-0" />
      <div>
        <p className="font-medium">{offline ? "Benny is offline" : error.code === "LIMIT" ? "Out of free generations" : "Something went wrong"}</p>
        <p className="mt-0.5 text-xs opacity-90">
          {error.error}
          {offline ? " No credit was used." : ""}
        </p>
      </div>
    </div>
  );
}
