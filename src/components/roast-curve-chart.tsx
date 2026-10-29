"use client";

import {
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipContentProps,
} from "recharts";
import { fmtTime, type CurvePoint } from "@/lib/mock-curve";

const C = {
  bt: "#E27D60",
  et: "#47918F",
  ror: "#8f9aa3",
  grid: "#2a3237",
  text: "#8f9aa3",
  sterile: "#E4E7EB",
};

const SERIES_LABEL: Record<string, string> = { bt: "Bean temp", et: "Env temp", ror: "RoR" };

function CurveTooltip({ active, payload, label }: Partial<TooltipContentProps<number, string>>) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-line bg-titanium/95 px-3 py-2 text-xs shadow-xl backdrop-blur">
      <p className="mb-1 font-mono text-muted">{fmtTime(Number(label))}</p>
      {payload.map((p) =>
        p.value == null ? null : (
          <p key={String(p.dataKey)} className="flex items-center gap-2 font-mono text-sterile">
            <span className="size-2 rounded-full" style={{ background: p.color }} />
            <span className="text-muted">{SERIES_LABEL[String(p.dataKey)] ?? p.name}</span>
            <span className="ml-auto pl-3">
              {Number(p.value).toFixed(1)}
              {p.dataKey === "ror" ? " °C/min" : " °C"}
            </span>
          </p>
        ),
      )}
    </div>
  );
}

export function RoastCurveChart({
  data,
  firstCrackSec,
  dropSec,
  height = 320,
  compact = false,
}: {
  data: CurvePoint[];
  firstCrackSec?: number;
  dropSec?: number;
  height?: number;
  compact?: boolean;
}) {
  const end = dropSec ?? data.at(-1)?.t ?? 0;
  const tick = { fill: C.text, fontSize: 11 };

  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={data}
          margin={compact ? { top: 4, right: 4, bottom: 4, left: 4 } : { top: 16, right: 8, bottom: 4, left: 0 }}
        >
          {!compact && <CartesianGrid stroke={C.grid} strokeDasharray="3 3" vertical={false} />}
          <XAxis
            dataKey="t"
            type="number"
            domain={[0, end]}
            tickFormatter={fmtTime}
            hide={compact}
            tick={tick}
            stroke={C.grid}
            tickLine={false}
          />
          <YAxis
            yAxisId="temp"
            domain={[50, "dataMax + 10"]}
            hide={compact}
            tick={tick}
            stroke={C.grid}
            tickLine={false}
            width={44}
            unit="°"
          />
          <YAxis
            yAxisId="ror"
            orientation="right"
            domain={[0, 25]}
            allowDataOverflow
            hide={compact}
            tick={tick}
            stroke={C.grid}
            tickLine={false}
            width={36}
          />

          {firstCrackSec != null && (
            <ReferenceArea
              yAxisId="temp"
              x1={firstCrackSec}
              x2={end}
              fill={C.et}
              fillOpacity={0.1}
              stroke="none"
              ifOverflow="extendDomain"
            />
          )}
          {firstCrackSec != null && (
            <ReferenceLine
              yAxisId="temp"
              x={firstCrackSec}
              stroke={C.sterile}
              strokeOpacity={0.5}
              strokeDasharray="4 4"
              label={compact ? undefined : { value: "FC", position: "insideTopLeft", fill: C.sterile, fontSize: 11 }}
            />
          )}
          {dropSec != null && (
            <ReferenceLine
              yAxisId="temp"
              x={dropSec}
              stroke={C.bt}
              strokeOpacity={0.7}
              strokeDasharray="4 4"
              label={compact ? undefined : { value: "Drop", position: "insideTopRight", fill: C.bt, fontSize: 11 }}
            />
          )}

          {!compact && <Tooltip content={<CurveTooltip />} cursor={{ stroke: C.grid }} />}
          {!compact && (
            <Legend
              verticalAlign="top"
              height={28}
              iconType="plainline"
              formatter={(v: string) => <span className="text-xs text-muted">{SERIES_LABEL[v] ?? v}</span>}
            />
          )}

          <Line yAxisId="temp" dataKey="et" name="et" stroke={C.et} strokeWidth={1.5} dot={false} isAnimationActive={!compact} />
          <Line yAxisId="temp" dataKey="bt" name="bt" stroke={C.bt} strokeWidth={2} dot={false} isAnimationActive={!compact} />
          <Line
            yAxisId="ror"
            dataKey="ror"
            name="ror"
            stroke={C.ror}
            strokeWidth={1.25}
            strokeDasharray="4 3"
            dot={false}
            connectNulls={false}
            isAnimationActive={!compact}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
