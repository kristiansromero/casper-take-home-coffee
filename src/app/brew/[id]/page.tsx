import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { Star } from "lucide-react";
import { EquipmentCard } from "@/components/equipment-card";
import { FlavorTags } from "@/components/flavor-tags";
import { ProBadge } from "@/components/pro-badge";
import { Card, CardTitle } from "@/components/ui/card";
import { db } from "@/lib/db";
import { cn, timeAgo } from "@/lib/utils";
import { METHOD_LABELS, formatDuration, formatRatio, type BrewMethod } from "../schema";

export const dynamic = "force-dynamic";

const getBrew = cache((id: string) =>
  db.extraction.findUnique({
    where: { id },
    include: {
      bean: { include: { roaster: true } },
      user: { select: { id: true, name: true, handle: true, isPro: true } },
      brewer: true,
      grinder: true,
    },
  }),
);

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const brew = await getBrew((await params).id);
  return { title: brew ? `${brew.bean.name} · ${brew.bean.roaster.name}` : "Brew not found" };
}

export default async function BrewDetailPage({ params }: Props) {
  const brew = await getBrew((await params).id);
  if (!brew) notFound();

  const { bean, user } = brew;
  const method = METHOD_LABELS[brew.method as BrewMethod] ?? brew.method;

  const params_: { label: string; value: string; accent?: boolean }[] = [
    { label: "Dose", value: `${brew.doseG} g` },
    { label: "Yield", value: `${brew.yieldG} g` },
    { label: "Ratio", value: formatRatio(brew.doseG, brew.yieldG), accent: true },
    { label: "Grind", value: brew.grind },
    { label: "Time", value: formatDuration(brew.timeSec) },
    { label: "Water", value: `${brew.tempC} °C` },
  ];

  const beanDetails = [
    ["Origin", bean.origin],
    ["Varietal", bean.varietal],
    ["Process", bean.process],
    ["Elevation", bean.elevation],
  ] as const;

  const gear = [brew.brewer, brew.grinder].filter((g) => g !== null);

  return (
    <article className="mx-auto flex w-full max-w-3xl flex-col gap-5 px-4 py-8 sm:py-12">
      <header>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-teal">{method}</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-sterile sm:text-4xl">{bean.name}</h1>
        <p className="mt-1 text-lg text-muted">{bean.roaster.name}</p>
        <p className="mt-3 flex flex-wrap items-center gap-2 text-sm text-muted">
          <Link href={`/profile/${user.id}`} className="font-medium text-sterile hover:text-teal-bright">
            {user.name}
          </Link>
          {user.isPro && <ProBadge />}
          <span>@{user.handle}</span>
          <span aria-hidden>·</span>
          <time dateTime={brew.createdAt.toISOString()}>{timeAgo(brew.createdAt)}</time>
        </p>
      </header>

      <Card>
        <div className="mb-4 flex items-center justify-between">
          <CardTitle>Extraction</CardTitle>
          {brew.rating ? (
            <div className="flex items-center gap-0.5" aria-label={`Rated ${brew.rating} of 5`}>
              {[1, 2, 3, 4, 5].map((n) => (
                <Star key={n} className={cn("size-4", n <= brew.rating! ? "fill-amber text-amber" : "text-line")} aria-hidden />
              ))}
            </div>
          ) : (
            <span className="text-xs text-muted">Unrated</span>
          )}
        </div>
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {params_.map((p) => (
            <div
              key={p.label}
              className={cn("rounded-xl border px-4 py-3", p.accent ? "border-teal/30 bg-teal/10" : "border-line bg-obsidian/50")}
            >
              <dt className="text-[11px] font-medium uppercase tracking-wider text-muted">{p.label}</dt>
              <dd className={cn("mt-1 font-mono text-xl tabular-nums", p.accent ? "text-teal-bright" : "text-sterile")}>{p.value}</dd>
            </div>
          ))}
        </dl>
      </Card>

      <Card>
        <CardTitle className="mb-4">Bean</CardTitle>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4">
          {beanDetails.map(([label, value]) => (
            <div key={label}>
              <dt className="text-[11px] font-medium uppercase tracking-wider text-muted">{label}</dt>
              <dd className={cn("mt-0.5 text-sm", value ? "text-sterile" : "text-muted/60")}>{value ?? "—"}</dd>
            </div>
          ))}
        </dl>
      </Card>

      {gear.length > 0 && (
        <section className="grid gap-3 sm:grid-cols-2" aria-label="Equipment">
          {gear.map((item) => (
            <EquipmentCard key={item.id} item={item} />
          ))}
        </section>
      )}

      {(brew.flavorTags.length > 0 || brew.notes) && (
        <Card>
          <CardTitle className="mb-4">Tasting</CardTitle>
          <FlavorTags tags={brew.flavorTags} max={brew.flavorTags.length} />
          {brew.notes && (
            <p className={cn("whitespace-pre-line text-sm leading-relaxed text-sterile/90", brew.flavorTags.length > 0 && "mt-4")}>
              {brew.notes}
            </p>
          )}
        </Card>
      )}
    </article>
  );
}
