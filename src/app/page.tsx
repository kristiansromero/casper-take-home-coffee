import Link from "next/link";
import { Coffee, Flame, Users } from "lucide-react";
import { db } from "@/lib/db";
import { feedInclude, initials, mergeFeed } from "@/lib/feed";
import { FeedItemCard } from "@/components/feed-item-card";
import { ProBadge } from "@/components/pro-badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const TABS = [
  { value: "all", label: "All" },
  { value: "brews", label: "Brews" },
  { value: "roasts", label: "Roasts" },
] as const;

type FeedType = (typeof TABS)[number]["value"];

export default async function FeedPage({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  const { type: rawType } = await searchParams;
  const type: FeedType = TABS.some((t) => t.value === rawType) ? (rawType as FeedType) : "all";

  const [brews, roasts, brewers] = await Promise.all([
    type === "roasts"
      ? []
      : db.extraction.findMany({ include: feedInclude, orderBy: { createdAt: "desc" }, take: 30 }),
    type === "brews" ? [] : db.roast.findMany({ include: feedInclude, orderBy: { createdAt: "desc" }, take: 30 }),
    db.user.findMany({
      take: 6,
      orderBy: { followers: { _count: "desc" } },
      select: {
        id: true,
        name: true,
        handle: true,
        isPro: true,
        credentials: true,
        _count: { select: { extractions: true, roasts: true, followers: true } },
      },
    }),
  ]);

  const items = mergeFeed(brews, roasts).slice(0, 30);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      {/* Hero */}
      <section className="relative mb-8 overflow-hidden rounded-3xl border border-line bg-titanium px-6 py-8 sm:px-10 sm:py-10">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-teal/15 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-32 right-40 size-64 rounded-full bg-amber/10 blur-3xl"
        />
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-teal-bright">The lab bench</p>
        <h1 className="mt-2 max-w-xl text-3xl font-semibold tracking-tight text-sterile sm:text-4xl">
          Community extractions &amp; roasts
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted sm:text-base">
          Dial-ins, ratios and roast curves from home baristas and roasters. Log yours, learn from theirs.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/brew">
              <Coffee /> Log a brew
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/roast">
              <Flame /> Log a roast
            </Link>
          </Button>
        </div>
      </section>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_280px]">
        <section aria-label="Activity feed">
          <nav
            aria-label="Filter feed"
            className="mb-5 inline-flex rounded-xl border border-line bg-titanium p-1 text-sm"
          >
            {TABS.map((tab) => {
              const active = tab.value === type;
              return (
                <Link
                  key={tab.value}
                  href={tab.value === "all" ? "/" : `/?type=${tab.value}`}
                  aria-current={active ? "page" : undefined}
                  scroll={false}
                  className={cn(
                    "rounded-lg px-4 py-1.5 font-medium transition-colors",
                    active ? "bg-teal text-obsidian" : "text-muted hover:bg-titanium-2 hover:text-sterile",
                  )}
                >
                  {tab.label}
                </Link>
              );
            })}
          </nav>

          {items.length === 0 ? (
            <Card className="flex flex-col items-center gap-3 py-14 text-center">
              <Coffee className="size-8 text-teal" />
              <p className="font-medium text-sterile">Nothing on the bench yet</p>
              <p className="max-w-sm text-sm text-muted">
                Be the first to share a {type === "roasts" ? "roast" : type === "brews" ? "brew" : "brew or roast"}.
              </p>
              <Button asChild size="sm" className="mt-2">
                <Link href={type === "roasts" ? "/roast" : "/brew"}>Start logging</Link>
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {items.map((item) => (
                <FeedItemCard key={`${item.kind}-${item.id}`} item={item} />
              ))}
            </div>
          )}
        </section>

        <aside className="hidden lg:block">
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="size-4 text-teal" /> Brewers to follow
              </CardTitle>
              <CardDescription>Most-followed people on the bench.</CardDescription>
            </CardHeader>
            <ul className="flex flex-col gap-1">
              {brewers.map((u) => (
                <li key={u.id}>
                  <Link
                    href={`/profile/${u.id}`}
                    className="flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-titanium-2"
                  >
                    <span className="grid size-9 shrink-0 place-items-center rounded-full border border-teal/40 bg-teal/10 text-xs font-semibold text-teal-bright">
                      {initials(u.name)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5">
                        <span className="truncate text-sm font-medium text-sterile">{u.name}</span>
                        {u.isPro && <ProBadge />}
                      </span>
                      <span className="block truncate text-xs text-muted">
                        {u._count.followers} followers · {u._count.extractions} brews · {u._count.roasts} roasts
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        </aside>
      </div>
    </div>
  );
}
