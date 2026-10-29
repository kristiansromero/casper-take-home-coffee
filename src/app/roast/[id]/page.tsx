import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { DownloadProfileButton } from "@/components/download-profile-button";
import { EquipmentCard } from "@/components/equipment-card";
import { FlavorTags } from "@/components/flavor-tags";
import { Markdown } from "@/components/markdown";
import { RoastCurveChart } from "@/components/roast-curve-chart";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/lib/db";
import { developmentPct, fmtTime, type CurvePoint } from "@/lib/mock-curve";
import { cn, timeAgo } from "@/lib/utils";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

const getRoast = cache((id: string) =>
  db.roast.findUnique({
    where: { id },
    include: { bean: { include: { roaster: true } }, user: true, machine: true },
  }),
);

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const roast = await getRoast((await params).id);
  if (!roast) return { title: "Roast not found" };
  return {
    title: `${roast.bean.name} roast by ${roast.user.name}`,
    description: `${roast.bean.roaster.name} · ${roast.machineName} · drop ${fmtTime(roast.dropSec)} @ ${roast.dropTempC} °C`,
  };
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={cn("rounded-xl border border-line bg-titanium/60 px-4 py-3", accent && "border-teal/40 bg-teal/10")}>
      <p className="text-[11px] font-medium uppercase tracking-wider text-muted">{label}</p>
      <p className={cn("mt-1 font-mono text-xl text-sterile", accent && "text-teal-bright")}>{value}</p>
    </div>
  );
}

export default async function RoastDetailPage({ params }: Params) {
  const roast = await getRoast((await params).id);
  if (!roast) notFound();

  const curve = (roast.curve ?? []) as unknown as CurvePoint[];
  const tp = curve.length ? curve.reduce((min, p) => (p.bt < min.bt ? p : min), curve[0]) : null;
  const dev = developmentPct(roast.firstCrackSec, roast.dropSec);

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-amber">Roast</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-sterile">{roast.bean.name}</h1>
          <p className="mt-1 text-sm text-muted">
            {roast.bean.roaster.name}
            {roast.bean.origin && <> · {roast.bean.origin}</>}
            {roast.bean.process && <> · {roast.bean.process}</>} · {roast.machineName}
          </p>
          <p className="mt-2 text-sm text-muted">
            by{" "}
            <Link href={`/profile/${roast.userId}`} className="text-teal-bright hover:underline">
              {roast.user.name}
            </Link>{" "}
            · <time dateTime={roast.createdAt.toISOString()}>{timeAgo(roast.createdAt)}</time>
          </p>
        </div>
        <DownloadProfileButton
          roast={{
            beanName: roast.bean.name,
            roasterName: roast.bean.roaster.name,
            machineName: roast.machineName,
            batchSizeG: roast.batchSizeG,
            chargeTempC: roast.chargeTempC,
            firstCrackSec: roast.firstCrackSec,
            dropSec: roast.dropSec,
            dropTempC: roast.dropTempC,
            flavorTags: roast.flavorTags,
            notes: roast.notes,
            curve,
            createdAt: roast.createdAt.toISOString(),
          }}
        />
      </header>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Charge" value={`${roast.chargeTempC} °C`} />
        <Stat label="Turning point ≈" value={tp ? `${fmtTime(tp.t)} · ${Math.round(tp.bt)}°` : "—"} />
        <Stat label="First crack" value={fmtTime(roast.firstCrackSec)} />
        <Stat label="Drop time" value={fmtTime(roast.dropSec)} />
        <Stat label="Drop temp" value={`${roast.dropTempC} °C`} />
        <Stat label="Development" value={`${dev}%`} accent />
        <Stat label="Dev time" value={fmtTime(roast.dropSec - roast.firstCrackSec)} />
        <Stat label="Batch size" value={`${roast.batchSizeG} g`} />
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Roast curve</CardTitle>
          <p className="text-xs text-muted">Simulated from logged milestones · BT, ET and rate of rise</p>
        </CardHeader>
        {curve.length ? (
          <RoastCurveChart data={curve} firstCrackSec={roast.firstCrackSec} dropSec={roast.dropSec} height={360} />
        ) : (
          <p className="text-sm text-muted">No curve data recorded.</p>
        )}
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Tasting</CardTitle>
          </CardHeader>
          {roast.flavorTags.length ? (
            <FlavorTags tags={roast.flavorTags} max={roast.flavorTags.length} />
          ) : (
            <p className="text-sm text-muted">No flavor tags.</p>
          )}
        </Card>
        <div className="flex flex-col gap-3">
          <p className="text-xs font-medium uppercase tracking-wider text-muted">Machine</p>
          {roast.machine ? (
            <EquipmentCard item={roast.machine} />
          ) : (
            <EquipmentCard item={{ category: "roaster", name: roast.machineName, blurb: null }} />
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Notes &amp; annotations</CardTitle>
        </CardHeader>
        {roast.notes ? <Markdown>{roast.notes}</Markdown> : <p className="text-sm text-muted">No notes.</p>}
      </Card>
    </div>
  );
}
