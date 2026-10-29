import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Award, Bean as BeanIcon, Coffee, Flame, History, Wrench } from "lucide-react";
import { db } from "@/lib/db";
import { feedInclude, initials, mergeFeed } from "@/lib/feed";
import { FeedItemCard } from "@/components/feed-item-card";
import { EquipmentCard } from "@/components/equipment-card";
import { ProBadge } from "@/components/pro-badge";
import { Card } from "@/components/ui/card";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

const CATEGORY_ORDER = ["espresso", "brewer", "grinder", "roaster", "kettle", "scale"];
const categoryRank = (c: string) => {
  const i = CATEGORY_ORDER.indexOf(c.toLowerCase());
  return i === -1 ? CATEGORY_ORDER.length : i;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const user = await db.user.findUnique({ where: { id }, select: { name: true, handle: true, bio: true } });
  if (!user) return { title: "Profile not found" };
  return {
    title: `${user.name} (@${user.handle})`,
    description: user.bio ?? `${user.name}'s brews, roasts and equipment on BeanWater.`,
  };
}

export default async function ProfilePage({ params }: Props) {
  const { id } = await params;

  const user = await db.user.findUnique({
    where: { id },
    include: {
      equipment: true,
      extractions: { include: feedInclude, orderBy: { createdAt: "desc" } },
      roasts: { include: feedInclude, orderBy: { createdAt: "desc" } },
      _count: { select: { followers: true, following: true } },
    },
  });
  if (!user) notFound();

  const logs = mergeFeed(user.extractions, user.roasts);

  // Distinct beans across brews + roasts, most-logged first.
  const beanMap = new Map<
    string,
    { bean: (typeof user.extractions)[number]["bean"]; brews: number; roasts: number; last: Date }
  >();
  for (const log of [...user.extractions, ...user.roasts]) {
    const entry = beanMap.get(log.beanId) ?? { bean: log.bean, brews: 0, roasts: 0, last: log.createdAt };
    if ("method" in log) entry.brews++;
    else entry.roasts++;
    if (log.createdAt > entry.last) entry.last = log.createdAt;
    beanMap.set(log.beanId, entry);
  }
  const beans = [...beanMap.values()].sort(
    (a, b) => b.brews + b.roasts - (a.brews + a.roasts) || b.last.getTime() - a.last.getTime(),
  );

  const equipment = [...user.equipment].sort(
    (a, b) => categoryRank(a.category) - categoryRank(b.category) || a.name.localeCompare(b.name),
  );

  const stats = [
    { label: "Followers", value: user._count.followers },
    { label: "Following", value: user._count.following },
    { label: "Brews", value: user.extractions.length },
    { label: "Roasts", value: user.roasts.length },
  ];

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      {/* Header */}
      <section className="relative overflow-hidden rounded-3xl border border-line bg-titanium p-6 sm:p-8">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-20 -top-20 size-64 rounded-full bg-teal/15 blur-3xl"
        />
        <div className="relative flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="flex items-start gap-5">
            <div className="grid size-20 shrink-0 place-items-center rounded-full border-2 border-teal/50 bg-gradient-to-br from-teal/25 to-obsidian text-2xl font-semibold tracking-tight text-teal-bright">
              {initials(user.name)}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-semibold tracking-tight text-sterile sm:text-3xl">{user.name}</h1>
                {user.isPro && <ProBadge />}
              </div>
              <p className="mt-0.5 font-mono text-sm text-muted">@{user.handle}</p>
              {user.bio && <p className="mt-3 max-w-xl text-sm leading-relaxed text-sterile/85">{user.bio}</p>}
            </div>
          </div>

          <dl className="grid grid-cols-4 gap-2 md:w-auto md:shrink-0">
            {stats.map((s) => (
              <div
                key={s.label}
                className="flex flex-col-reverse items-center rounded-xl border border-line bg-obsidian/50 px-3 py-2.5 md:min-w-20"
              >
                <dt className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted">{s.label}</dt>
                <dd className="font-mono text-xl font-semibold tabular-nums text-sterile">{s.value}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Credentials */}
        <div className="relative mt-6 flex items-start gap-3 rounded-2xl border border-amber/30 bg-amber/[0.07] p-4">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-amber/15 text-amber">
            <Award className="size-5" />
          </span>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-amber">Coffee credentials</p>
            <p className="mt-0.5 text-sm text-sterile">
              {user.credentials ?? <span className="text-muted">No credentials listed yet.</span>}
            </p>
          </div>
        </div>
      </section>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        {/* Past logs */}
        <section aria-labelledby="logs-heading">
          <SectionHeading id="logs-heading" icon={<History className="size-4" />}>
            Past logs
          </SectionHeading>
          {logs.length === 0 ? (
            <Card className="py-10 text-center text-sm text-muted">No brews or roasts logged yet.</Card>
          ) : (
            <div className="flex flex-col gap-5">
              {logs.map((item) => (
                <FeedItemCard key={`${item.kind}-${item.id}`} item={item} />
              ))}
            </div>
          )}
        </section>

        <div className="flex flex-col gap-8">
          {/* Equipment shelf */}
          <section aria-labelledby="shelf-heading">
            <SectionHeading id="shelf-heading" icon={<Wrench className="size-4" />}>
              Equipment shelf
            </SectionHeading>
            {equipment.length === 0 ? (
              <Card className="py-8 text-center text-sm text-muted">Shelf is empty.</Card>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1">
                {equipment.map((item) => (
                  <EquipmentCard key={item.id} item={item} />
                ))}
              </div>
            )}
          </section>

          {/* Bean history */}
          <section aria-labelledby="beans-heading">
            <SectionHeading id="beans-heading" icon={<BeanIcon className="size-4" />}>
              Bean history
            </SectionHeading>
            {beans.length === 0 ? (
              <Card className="py-8 text-center text-sm text-muted">No beans logged yet.</Card>
            ) : (
              <Card className="p-0">
                <ul className="divide-y divide-line">
                  {beans.map(({ bean, brews, roasts }) => (
                    <li key={bean.id} className="flex items-start justify-between gap-3 px-4 py-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-sterile">{bean.name}</p>
                        <p className="truncate text-xs text-muted">{bean.roaster.name}</p>
                        <p className="mt-1 text-xs text-muted/80">
                          {[bean.origin, bean.process].filter(Boolean).join(" · ") || "Origin unknown"}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1 text-xs">
                        {brews > 0 && (
                          <span className="inline-flex items-center gap-1 text-teal-bright">
                            <Coffee className="size-3" /> {brews}
                          </span>
                        )}
                        {roasts > 0 && (
                          <span className="inline-flex items-center gap-1 text-amber">
                            <Flame className="size-3" /> {roasts}
                          </span>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </Card>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function SectionHeading({ id, icon, children }: { id: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <h2 id={id} className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.16em] text-muted">
      <span className="text-teal">{icon}</span>
      {children}
    </h2>
  );
}
