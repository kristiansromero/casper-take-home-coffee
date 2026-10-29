import type { Metadata } from "next";
import { Check, Lock, Minus, Sparkles } from "lucide-react";
import { ProBadge } from "@/components/pro-badge";
import { RoastCurveChart } from "@/components/roast-curve-chart";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input, Select } from "@/components/ui/form-controls";
import { Tooltip } from "@/components/ui/tooltip";
import { developmentPct, fmtTime, generateCurve, type CurveParams } from "@/lib/mock-curve";

export const metadata: Metadata = {
  title: "Roast Me · AI roast profiles",
  description: "Pro: AI-generated roast profiles tuned to your bean and machine.",
};

type SampleProfile = {
  title: string;
  level: string;
  batchG: number;
  params: Required<CurveParams>;
  rationale: string;
};

const SAMPLES: SampleProfile[] = [
  {
    title: "Ethiopia Guji Natural",
    level: "Light",
    batchG: 90,
    params: { chargeTempC: 205, firstCrackSec: 465, dropSec: 545, dropTempC: 203, seed: 11 },
    rationale:
      "High-grown heirloom at ~2,100 m reads dense, so a hot 205 °C charge keeps momentum through drying. Naturals scorch easily as sugars caramelize, so heat is eased before yellowing to land a declining RoR into first crack. A short 14.7% development preserves blueberry and jasmine aromatics without baked notes.",
  },
  {
    title: "Colombia Huila Washed",
    level: "Medium",
    batchG: 100,
    params: { chargeTempC: 200, firstCrackSec: 500, dropSec: 610, dropTempC: 210, seed: 23 },
    rationale:
      "Washed Caturra/Castillo at medium density tolerates a moderate charge. A longer Maillard phase builds caramel and red-apple sweetness, and an 18% development drops at 210 °C for balanced acidity with a round, cocoa-tinged body. Watch the flick after first crack; fan up slightly on the Skywalker to flatten it.",
  },
  {
    title: "Brazil Cerrado Natural",
    level: "Medium-Dark",
    batchG: 100,
    params: { chargeTempC: 195, firstCrackSec: 520, dropSec: 670, dropTempC: 218, seed: 37 },
    rationale:
      "Low-density, low-altitude naturals take heat fast, so a gentler 195 °C charge avoids tipping. Development is stretched to 22% and dropped at 218 °C to push nutty, chocolate and brown-sugar notes for espresso, stopping short of second crack to keep bitterness in check.",
  },
];

const FEATURES: { name: string; free: boolean; pro: boolean }[] = [
  { name: "Brew & roast logging", free: true, pro: true },
  { name: "SCA flavor tagging", free: true, pro: true },
  { name: "Community feed", free: true, pro: true },
  { name: "Export profiles", free: true, pro: true },
  { name: ".alog upload (Artisan curves)", free: false, pro: true },
  { name: "AI Roast Profile Generation", free: false, pro: true },
];

function UpgradeButton({ className }: { className?: string }) {
  return (
    <Tooltip content="Billing not enabled in this demo">
      <Button
        type="button"
        variant="amber"
        size="lg"
        aria-disabled="true"
        className={className}
      >
        <Sparkles /> Upgrade to Pro
      </Button>
    </Tooltip>
  );
}

export default function RoastMePage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl border border-amber/30 bg-titanium p-6 sm:p-10">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-24 size-80 rounded-full bg-amber/15 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-24 -left-16 size-64 rounded-full bg-teal/10 blur-3xl"
        />
        <div className="relative grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:items-center">
          <div>
            <div className="flex items-center gap-2">
              <ProBadge />
              <span className="text-xs font-medium uppercase tracking-[0.2em] text-amber">Roast Me</span>
            </div>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-sterile sm:text-4xl">
              Upgrade to Pro for AI Roast Profile Generation
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted sm:text-base">
              Tell us the bean and your machine. Roast Me reads origin, process, altitude and density, then
              generates a full target curve with charge temperature, turning point, first-crack timing, drop and
              development ratio, plus the reasoning behind each choice. Tuned for fluid-bed and drum home roasters
              like the Skywalker V2.
            </p>
            <UpgradeButton className="mt-6" />
          </div>

          {/* Locked form preview */}
          <div className="relative">
            <form
              aria-hidden
              inert
              className="glass flex flex-col gap-4 rounded-2xl p-5 opacity-60 blur-[1.5px] select-none"
            >
              <Field label="Bean" required>
                <Input disabled defaultValue="Ethiopia Guji Natural, Heirloom, 2,100 m" />
              </Field>
              <Field label="Machine" required>
                <Select disabled defaultValue="skywalker">
                  <option value="skywalker">Skywalker V2</option>
                </Select>
              </Field>
              <Field label="Target roast level" required>
                <Select disabled defaultValue="light">
                  <option value="light">Light (filter)</option>
                </Select>
              </Field>
              <Button type="button" disabled className="mt-1">
                <Sparkles /> Generate profile
              </Button>
            </form>
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-2xl bg-obsidian/40 text-center">
              <span className="grid size-12 place-items-center rounded-full border border-amber/40 bg-amber/15 text-amber">
                <Lock className="size-5" />
              </span>
              <p className="text-sm font-medium text-sterile">Pro feature</p>
              <UpgradeButton />
            </div>
          </div>
        </div>
      </section>

      {/* Sample output */}
      <section aria-labelledby="samples-heading" className="mt-12">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-teal-bright">Sample output</p>
            <h2 id="samples-heading" className="mt-1 text-2xl font-semibold tracking-tight text-sterile">
              What Pro generates for a Skywalker V2
            </h2>
          </div>
          <span className="rounded-full border border-line px-3 py-1 text-xs text-muted">
            Illustrative examples, not live AI output
          </span>
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          {SAMPLES.map((s) => {
            const curve = generateCurve(s.params);
            const dev = developmentPct(s.params.firstCrackSec, s.params.dropSec);
            const milestones = [
              { label: "Charge", value: `${s.params.chargeTempC}°C` },
              { label: "First crack", value: fmtTime(s.params.firstCrackSec) },
              { label: "Drop", value: `${fmtTime(s.params.dropSec)} · ${s.params.dropTempC}°C` },
              { label: "Development", value: `${dev}%` },
            ];
            return (
              <Card key={s.title} className="flex flex-col gap-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold tracking-tight text-sterile">{s.title}</h3>
                    <p className="text-xs text-muted">
                      {s.level} · Skywalker V2 · {s.batchG} g batch
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full border border-teal/40 bg-teal/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-teal-bright">
                    Sample
                  </span>
                </div>
                <div className="overflow-hidden rounded-xl border border-line/70 bg-obsidian/40 p-2">
                  <RoastCurveChart
                    data={curve}
                    firstCrackSec={s.params.firstCrackSec}
                    dropSec={s.params.dropSec}
                    height={220}
                    compact={false}
                  />
                </div>
                <dl className="grid grid-cols-2 gap-2">
                  {milestones.map((m) => (
                    <div key={m.label} className="rounded-lg border border-line/70 bg-obsidian/40 px-3 py-2">
                      <dt className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted">{m.label}</dt>
                      <dd className="font-mono text-sm tabular-nums text-sterile">{m.value}</dd>
                    </div>
                  ))}
                </dl>
                <div className="rounded-xl border-l-2 border-teal/60 bg-teal/[0.05] px-3 py-2.5">
                  <p className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-teal-bright">
                    <Sparkles className="size-3" /> AI rationale
                  </p>
                  <p className="text-sm leading-relaxed text-sterile/85">{s.rationale}</p>
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Free vs Pro */}
      <section aria-labelledby="compare-heading" className="mt-12">
        <h2 id="compare-heading" className="mb-5 text-2xl font-semibold tracking-tight text-sterile">
          Free vs Pro
        </h2>
        <Card className="overflow-x-auto p-0">
          <table className="w-full min-w-[420px] text-sm">
            <thead>
              <tr className="border-b border-line text-left">
                <th scope="col" className="px-5 py-3 font-medium text-muted">
                  Feature
                </th>
                <th scope="col" className="w-28 px-5 py-3 text-center font-medium text-sterile">
                  Free
                </th>
                <th scope="col" className="w-28 bg-amber/[0.06] px-5 py-3 text-center">
                  <ProBadge />
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {FEATURES.map((f) => (
                <tr key={f.name}>
                  <th scope="row" className="px-5 py-3 text-left font-normal text-sterile">
                    {f.name}
                  </th>
                  <td className="px-5 py-3 text-center">
                    <Mark on={f.free} />
                  </td>
                  <td className="bg-amber/[0.06] px-5 py-3 text-center">
                    <Mark on={f.pro} pro />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
        <div className="mt-6 flex justify-center">
          <UpgradeButton />
        </div>
      </section>
    </div>
  );
}

function Mark({ on, pro }: { on: boolean; pro?: boolean }) {
  return on ? (
    <Check aria-label="Included" className={pro ? "mx-auto size-4 text-amber" : "mx-auto size-4 text-teal-bright"} />
  ) : (
    <Minus aria-label="Not included" className="mx-auto size-4 text-muted/50" />
  );
}
