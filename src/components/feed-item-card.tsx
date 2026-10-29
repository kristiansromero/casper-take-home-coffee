"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Coffee, Flame, Star } from "lucide-react";
import { FlavorTags } from "@/components/flavor-tags";
import { RoastCurveChart } from "@/components/roast-curve-chart";
import { cn, timeAgo } from "@/lib/utils";
import { developmentPct, fmtTime, type CurvePoint } from "@/lib/mock-curve";

type FeedUser = { id: string; name: string; handle: string };

type FeedBase = {
  id: string;
  createdAt: Date;
  user: FeedUser;
  beanName: string;
  roasterName: string;
  flavorTags: string[];
};

export type FeedItem =
  | (FeedBase & {
      kind: "brew";
      method: string;
      doseG: number;
      yieldG: number;
      timeSec: number;
      tempC: number;
      rating: number | null;
    })
  | (FeedBase & {
      kind: "roast";
      machineName: string;
      firstCrackSec: number;
      dropSec: number;
      dropTempC: number;
      curve: CurvePoint[];
    });

const fmtNum = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1));

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted">{label}</span>
      <span className="font-mono text-sm tabular-nums text-sterile">{value}</span>
    </div>
  );
}

export function FeedItemCard({ item, className }: { item: FeedItem; className?: string }) {
  const isBrew = item.kind === "brew";
  const href = `/${item.kind}/${item.id}`;
  const label = isBrew ? `${item.method} of ${item.beanName}` : `Roast of ${item.beanName}`;

  return (
    <motion.article
      whileHover={{ y: -3 }}
      transition={{ type: "spring", stiffness: 400, damping: 28 }}
      className={cn(
        "glass group relative flex flex-col gap-4 rounded-2xl p-5 transition-colors hover:border-teal/40",
        className,
      )}
    >
      {/* Overlay link makes the whole card clickable without nesting anchors. */}
      <Link href={href} aria-label={`View ${label}`} className="absolute inset-0 z-0 rounded-2xl" />

      <header className="flex items-center justify-between gap-3">
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold",
            isBrew ? "border-teal/40 bg-teal/10 text-teal-bright" : "border-amber/40 bg-amber/10 text-amber",
          )}
        >
          {isBrew ? <Coffee className="size-3.5" /> : <Flame className="size-3.5" />}
          {isBrew ? "Brew" : "Roast"}
        </span>
        <div className="flex min-w-0 items-center gap-1.5 text-xs text-muted">
          <Link
            href={`/profile/${item.user.id}`}
            className="relative z-10 truncate font-medium text-sterile hover:text-teal-bright hover:underline"
          >
            {item.user.name}
          </Link>
          <span className="hidden truncate sm:inline">@{item.user.handle}</span>
          <span aria-hidden>·</span>
          <time dateTime={new Date(item.createdAt).toISOString()} suppressHydrationWarning className="shrink-0">
            {timeAgo(new Date(item.createdAt))}
          </time>
        </div>
      </header>

      <div>
        <h3 className="text-lg font-semibold leading-tight tracking-tight text-sterile group-hover:text-teal-bright">
          {item.beanName}
        </h3>
        <p className="mt-0.5 text-sm text-muted">
          {item.roasterName}
          <span className="mx-1.5 text-line">/</span>
          <span className="capitalize">{isBrew ? item.method : item.machineName}</span>
        </p>
      </div>

      {item.kind === "brew" ? (
        <div className="grid grid-cols-4 gap-3 rounded-xl border border-line/70 bg-obsidian/40 px-3 py-2.5">
          <Stat label="Dose → Yield" value={`${fmtNum(item.doseG)}→${fmtNum(item.yieldG)}g`} />
          <Stat label="Ratio" value={`1:${(item.yieldG / item.doseG).toFixed(1)}`} />
          <Stat label="Time" value={fmtTime(item.timeSec)} />
          <Stat label="Temp" value={`${fmtNum(item.tempC)}°C`} />
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <div className="pointer-events-none overflow-hidden rounded-xl border border-line/70 bg-obsidian/40">
            <RoastCurveChart
              data={item.curve}
              firstCrackSec={item.firstCrackSec}
              dropSec={item.dropSec}
              height={90}
              compact
            />
          </div>
          <div className="grid grid-cols-3 gap-3 rounded-xl border border-line/70 bg-obsidian/40 px-3 py-2.5">
            <Stat label="First crack" value={fmtTime(item.firstCrackSec)} />
            <Stat label="Drop" value={`${fmtTime(item.dropSec)} · ${fmtNum(item.dropTempC)}°`} />
            <Stat label="Dev" value={`${developmentPct(item.firstCrackSec, item.dropSec)}%`} />
          </div>
        </div>
      )}

      <footer className="flex items-end justify-between gap-3">
        <div className="relative z-10 min-w-0">
          {item.flavorTags.length > 0 ? (
            <FlavorTags tags={item.flavorTags} max={5} />
          ) : (
            <span className="text-xs text-muted/70">No flavor notes</span>
          )}
        </div>
        {item.kind === "brew" && item.rating != null && (
          <span className="flex shrink-0 items-center gap-1 text-xs font-medium text-amber">
            <Star className="size-3.5 fill-amber" />
            {item.rating}/5
          </span>
        )}
      </footer>
    </motion.article>
  );
}
