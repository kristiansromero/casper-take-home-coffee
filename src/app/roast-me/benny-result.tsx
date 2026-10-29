"use client";

import { useState } from "react";
import Link from "next/link";
import ReactMarkdown, { type Components } from "react-markdown";
import { Download, Loader2, Users } from "lucide-react";
import { RoastCurveChart } from "@/components/roast-curve-chart";
import { BennyAvatar } from "@/components/benny-avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { downloadBennyPackage } from "@/lib/export-profile";
import { fmtTime } from "@/lib/mock-curve";
import type { BennyRun } from "./types";

const md: Components = {
  h1: ({ children }) => <h3 className="mt-5 text-lg font-semibold tracking-tight text-sterile first:mt-0">{children}</h3>,
  h2: ({ children }) => (
    <h3 className="mt-5 border-b border-line/70 pb-1 text-sm font-semibold uppercase tracking-[0.14em] text-teal-bright first:mt-0">
      {children}
    </h3>
  ),
  h3: ({ children }) => <h4 className="mt-4 text-sm font-semibold text-sterile">{children}</h4>,
  p: ({ children }) => <p className="mt-2 text-sm leading-relaxed text-sterile/85">{children}</p>,
  ul: ({ children }) => <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-sterile/85 marker:text-teal">{children}</ul>,
  ol: ({ children }) => <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-sterile/85 marker:text-teal">{children}</ol>,
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  strong: ({ children }) => <strong className="font-semibold text-sterile">{children}</strong>,
  em: ({ children }) => <em className="text-sterile/90">{children}</em>,
  code: ({ children }) => <code className="rounded bg-obsidian/70 px-1 py-0.5 font-mono text-xs text-amber">{children}</code>,
  blockquote: ({ children }) => (
    <blockquote className="mt-3 border-l-2 border-amber/60 bg-amber/[0.05] px-3 py-1 text-sm">{children}</blockquote>
  ),
  a: ({ children, href }) => (
    <a href={href} target="_blank" rel="noreferrer" className="text-teal-bright underline underline-offset-2">
      {children}
    </a>
  ),
};

export function BennyResult({ run }: { run: BennyRun }) {
  const { output: o, input, groundedOn } = run;
  const m = o.milestones;
  const [exporting, setExporting] = useState(false);

  const tiles = [
    { label: "Charge", value: `${m.chargeTempC}°C` },
    { label: "Dry end", value: fmtTime(m.dryEndSec) },
    { label: "First crack", value: fmtTime(m.firstCrackSec) },
    { label: "Drop", value: `${fmtTime(m.dropSec)} · ${m.dropTempC}°C` },
    { label: "Development", value: `${m.developmentPct}%` },
  ];

  async function onExport() {
    setExporting(true);
    try {
      await downloadBennyPackage({
        beanName: input.beanName,
        machineName: input.machine,
        batchSizeG: input.batchSizeG,
        targetRoast: input.targetRoast,
        headline: o.headline,
        strategyMarkdown: o.strategyMarkdown,
        milestones: m,
        expectedNotes: o.expectedNotes,
        curve: o.curve,
        groundedOn,
        createdAt: run.createdAt,
      });
    } finally {
      setExporting(false);
    }
  }

  return (
    <Card className="flex flex-col gap-5" aria-live="polite">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <BennyAvatar size="sm" className="mt-0.5" />
          <div>
            <p className="text-xs text-muted">
              {input.beanName} · {input.targetRoast} · {input.machine} · {input.batchSizeG} g
            </p>
            <h2 className="mt-1 text-lg font-semibold leading-snug tracking-tight text-sterile">{o.headline}</h2>
          </div>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={onExport} disabled={exporting}>
          {exporting ? <Loader2 className="animate-spin" /> : <Download />} Export Roast Package (.zip)
        </Button>
      </div>

      <dl className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        {tiles.map((t) => (
          <div key={t.label} className="rounded-lg border border-line/70 bg-obsidian/40 px-3 py-2">
            <dt className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted">{t.label}</dt>
            <dd className="font-mono text-sm tabular-nums text-sterile">{t.value}</dd>
          </div>
        ))}
      </dl>

      <div className="overflow-hidden rounded-xl border border-line/70 bg-obsidian/40 p-2">
        <RoastCurveChart data={o.curve} firstCrackSec={m.firstCrackSec} dropSec={m.dropSec} height={300} />
      </div>

      {o.expectedNotes.length > 0 && (
        <div>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">Expected notes</p>
          <ul className="flex flex-wrap gap-2">
            {o.expectedNotes.map((n) => (
              <li key={n} className="rounded-full border border-teal/40 bg-teal/10 px-3 py-1 text-xs text-teal-bright">
                {n}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="rounded-xl border border-line/70 bg-obsidian/30 p-4">
        <ReactMarkdown components={md} skipHtml>
          {o.strategyMarkdown}
        </ReactMarkdown>
      </div>

      <div className="rounded-xl border-l-2 border-teal/60 bg-teal/[0.05] px-3 py-2.5">
        <p className="flex items-center gap-1.5 text-xs font-semibold text-teal-bright">
          <Users className="size-3.5" /> Grounded on {groundedOn.length} community roast{groundedOn.length === 1 ? "" : "s"}
        </p>
        {groundedOn.length > 0 && (
          <ul className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-xs">
            {groundedOn.map((g) => (
              <li key={g.id}>
                <Link href={`/roast/${g.id}`} className="text-sterile/85 underline-offset-2 hover:text-teal-bright hover:underline">
                  {g.beanName}
                  {g.process ? <span className="text-muted"> · {g.process}</span> : null}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  );
}
