import type { Metadata } from "next";
import Link from "next/link";
import { Check, LogIn, Minus, Sparkles } from "lucide-react";
import { BennyAvatar, BennyBadge } from "@/components/benny-avatar";
import { ProBadge } from "@/components/pro-badge";
import { RoastCurveChart } from "@/components/roast-curve-chart";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getOnboardedViewer } from "@/lib/auth";
import { db } from "@/lib/db";
import { developmentPct, fmtTime, generateCurve, type CurveParams } from "@/lib/mock-curve";
import { BennyWorkspace } from "./benny-form";
import { FREE_LIMIT, type BennyOutput, type BennyRun, type BennyRunInput, type GroundedOn } from "./types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Benny · AI Coffee SME",
  description: "Benny, BeanWater's AI Coffee SME, generates roast profiles grounded in community roasts.",
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
  { name: "Benny AI roast profiles", free: true, pro: true },
  { name: "Unlimited Benny generations", free: false, pro: true },
];

function toRun(r: { id: string; createdAt: Date; input: unknown; output: unknown }): BennyRun | null {
  const output = r.output as (BennyOutput & { groundedOn?: GroundedOn[] }) | null;
  const input = r.input as BennyRunInput | null;
  if (!output?.milestones || !Array.isArray(output.curve) || !input?.beanName) return null;
  const { groundedOn = [], ...rest } = output;
  return { id: r.id, createdAt: r.createdAt.toISOString(), input, output: rest, groundedOn };
}

export default async function RoastMePage() {
  const viewer = await getOnboardedViewer();

  let workspace: React.ReactNode = null;
  if (viewer) {
    const rows = await db.roastMeRun.findMany({
      where: { userId: viewer.id },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, createdAt: true, input: true, output: true },
    });
    const pastRuns = rows.map(toRun).filter((r): r is BennyRun => r !== null);
    workspace = (
      <BennyWorkspace
        initialCreditsLeft={Math.max(0, FREE_LIMIT - viewer.aiUsageCount)}
        isPro={viewer.isPro}
        pastRuns={pastRuns}
      />
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl border border-teal/30 bg-titanium p-6 sm:p-8">
        <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 size-80 rounded-full bg-teal/15 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -bottom-24 -left-16 size-64 rounded-full bg-amber/10 blur-3xl" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <BennyBadge size="lg" />
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-sterile sm:text-4xl">
              Benny <span className="text-muted">|</span> AI Coffee SME
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
              Master Roaster, Q Grader and thermal-dynamics nerd. Tell Benny the bean and your machine and get a full
              target curve, charge, first-crack and drop milestones, development ratio, expected SCA flavor notes and
              the reasoning behind every choice, grounded in similar roasts from the BeanWater community.
            </p>
          </div>
          {!viewer && (
            <Button asChild size="lg" className="shrink-0">
              <Link href="/sign-in?redirect_url=/roast-me">
                <LogIn /> Sign in to ask Benny
              </Link>
            </Button>
          )}
        </div>
      </section>

      {viewer ? (
        <section className="mt-8" aria-label="Generate a roast profile">
          {workspace}
        </section>
      ) : (
        <>
          {/* Sample output */}
          <section aria-labelledby="samples-heading" className="mt-12">
            <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-teal-bright">Sample output</p>
                <h2 id="samples-heading" className="mt-1 text-2xl font-semibold tracking-tight text-sterile">
                  What Benny generates for a Skywalker V2
                </h2>
              </div>
              <span className="rounded-full border border-line px-3 py-1 text-xs text-muted">
                Illustrative examples, not live AI output
              </span>
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
              {SAMPLES.slice(0, 2).map((s) => {
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
                      />
                    </div>
                    <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {milestones.map((m) => (
                        <div key={m.label} className="rounded-lg border border-line/70 bg-obsidian/40 px-3 py-2">
                          <dt className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted">{m.label}</dt>
                          <dd className="font-mono text-sm tabular-nums text-sterile">{m.value}</dd>
                        </div>
                      ))}
                    </dl>
                    <div className="flex gap-3 rounded-xl border-l-2 border-teal/60 bg-teal/[0.05] px-3 py-2.5">
                      <BennyAvatar size="sm" />
                      <p className="text-sm leading-relaxed text-sterile/85">{s.rationale}</p>
                    </div>
                  </Card>
                );
              })}
            </div>
          </section>

          {/* Free vs Pro */}
          <section aria-labelledby="compare-heading" className="mt-12">
            <h2 id="compare-heading" className="mb-2 text-2xl font-semibold tracking-tight text-sterile">
              Free vs Pro
            </h2>
            <p className="mb-5 text-sm text-muted">
              Every account gets {FREE_LIMIT} free Benny generations. Pro makes them unlimited.
            </p>
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
              <Button asChild size="lg">
                <Link href="/sign-in?redirect_url=/roast-me">
                  <Sparkles /> Sign in for {FREE_LIMIT} free generations
                </Link>
              </Button>
            </div>
          </section>
        </>
      )}
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
