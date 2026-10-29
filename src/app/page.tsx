import Link from "next/link";
import { Coffee, Compass, Flame, Rss, Users } from "lucide-react";
import { db } from "@/lib/db";
import { getOnboardedViewer } from "@/lib/auth";
import { feedInclude, initials, mergeFeed } from "@/lib/feed";
import { FeedItemCard } from "@/components/feed-item-card";
import { FollowButton } from "@/components/follow-button";
import { ProBadge } from "@/components/pro-badge";
import { WelcomeHero } from "@/components/welcome-hero";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const TYPE_TABS = [
  { value: "all", label: "All" },
  { value: "brews", label: "Brews" },
  { value: "roasts", label: "Roasts" },
] as const;

const FEED_TABS = [
  { value: "following", label: "Following", icon: Rss },
  { value: "discover", label: "Discover", icon: Compass },
] as const;

type FeedType = (typeof TYPE_TABS)[number]["value"];
type FeedScope = (typeof FEED_TABS)[number]["value"];

function feedHref(feed: FeedScope, type: FeedType, defaultFeed: FeedScope) {
  const params = new URLSearchParams();
  if (feed !== defaultFeed) params.set("feed", feed);
  if (type !== "all") params.set("type", type);
  const qs = params.toString();
  return qs ? `/?${qs}` : "/";
}

export default async function FeedPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; feed?: string }>;
}) {
  const { type: rawType, feed: rawFeed } = await searchParams;
  const type: FeedType = TYPE_TABS.some((t) => t.value === rawType)
    ? (rawType as FeedType)
    : "all";

  const viewer = await getOnboardedViewer();
  const signedIn = !!viewer;
  const defaultFeed: FeedScope = signedIn ? "following" : "discover";
  const feed: FeedScope =
    signedIn && rawFeed === "discover" ? "discover" : defaultFeed;

  const followingIds = viewer
    ? (
        await db.follow.findMany({
          where: { followerId: viewer.id },
          select: { followingId: true },
        })
      ).map((f) => f.followingId)
    : [];

  const where =
    feed === "following" && viewer
      ? { userId: { in: [...followingIds, viewer.id] } }
      : {};
  const excludeIds = viewer ? [viewer.id, ...followingIds] : [];

  const [brews, roasts, brewers] = await Promise.all([
    type === "roasts"
      ? []
      : db.extraction.findMany({
          where,
          include: feedInclude,
          orderBy: { createdAt: "desc" },
          take: 30,
        }),
    type === "brews"
      ? []
      : db.roast.findMany({
          where,
          include: feedInclude,
          orderBy: { createdAt: "desc" },
          take: 30,
        }),
    db.user.findMany({
      take: 6,
      where: excludeIds.length ? { id: { notIn: excludeIds } } : undefined,
      orderBy: { followers: { _count: "desc" } },
      select: {
        id: true,
        name: true,
        handle: true,
        isPro: true,
        credentials: true,
        _count: {
          select: { extractions: true, roasts: true, followers: true },
        },
      },
    }),
  ]);

  const items = mergeFeed(brews, roasts).slice(0, 30);
  const quietFollowing = feed === "following" && items.length === 0;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      {signedIn ? (
        <section className="relative mb-8 overflow-hidden rounded-3xl border border-line bg-titanium px-6 py-8 sm:px-10 sm:py-10">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-teal/15 blur-3xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-32 right-40 size-64 rounded-full bg-amber/10 blur-3xl"
          />
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-teal-bright">
            The lab bench
          </p>
          <h1 className="mt-2 max-w-xl text-3xl font-semibold tracking-tight text-sterile sm:text-4xl">
            Community extractions &amp; roasts
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted sm:text-base">
            Dial-ins, ratios and roast curves from home baristas and roasters.
            Log yours, learn from theirs.
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
      ) : (
        <div className="mb-8">
          <WelcomeHero />
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_280px]">
        <section aria-label="Activity feed">
          <div className="mb-5 flex flex-wrap items-center gap-3">
            {signedIn && (
              <nav
                aria-label="Choose feed"
                className="inline-flex rounded-xl border border-line bg-titanium p-1 text-sm"
              >
                {FEED_TABS.map((tab) => {
                  const active = tab.value === feed;
                  const Icon = tab.icon;
                  return (
                    <Link
                      key={tab.value}
                      href={feedHref(tab.value, type, defaultFeed)}
                      aria-current={active ? "page" : undefined}
                      scroll={false}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-lg px-4 py-1.5 font-medium transition-colors",
                        active
                          ? "bg-teal text-obsidian"
                          : "text-muted hover:bg-titanium-2 hover:text-sterile",
                      )}
                    >
                      <Icon className="size-3.5" aria-hidden /> {tab.label}
                    </Link>
                  );
                })}
              </nav>
            )}
            <nav
              aria-label="Filter feed by type"
              className="inline-flex rounded-xl border border-line bg-titanium p-1 text-sm"
            >
              {TYPE_TABS.map((tab) => {
                const active = tab.value === type;
                return (
                  <Link
                    key={tab.value}
                    href={feedHref(feed, tab.value, defaultFeed)}
                    aria-current={active ? "page" : undefined}
                    scroll={false}
                    className={cn(
                      "rounded-lg px-3 py-1.5 font-medium transition-colors sm:px-4",
                      active
                        ? "bg-titanium-2 text-sterile"
                        : "text-muted hover:bg-titanium-2 hover:text-sterile",
                    )}
                  >
                    {tab.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          {quietFollowing ? (
            <Card className="flex flex-col items-center gap-3 px-4 py-12 text-center">
              <Rss className="size-8 text-teal" />
              <p className="font-medium text-sterile">Your feed is quiet</p>
              <p className="max-w-sm text-sm text-muted">
                {followingIds.length === 0
                  ? "Follow a few brewers and their dial-ins and roast curves will land here."
                  : `Nobody you follow has logged ${type === "roasts" ? "a roast" : type === "brews" ? "a brew" : "anything"} yet.`}
              </p>
              {brewers.length > 0 && (
                <ul className="mt-3 flex w-full max-w-md flex-col gap-1 text-left">
                  {brewers.slice(0, 4).map((u) => (
                    <BrewerRow key={u.id} user={u} signedIn={signedIn} />
                  ))}
                </ul>
              )}
              <Button asChild size="sm" variant="outline" className="mt-2">
                <Link href={feedHref("discover", type, defaultFeed)}>
                  <Compass /> Browse Discover
                </Link>
              </Button>
            </Card>
          ) : items.length === 0 ? (
            <Card className="flex flex-col items-center gap-3 py-14 text-center">
              <Coffee className="size-8 text-teal" />
              <p className="font-medium text-sterile">
                Nothing on the bench yet
              </p>
              <p className="max-w-sm text-sm text-muted">
                Be the first to share a{" "}
                {type === "roasts"
                  ? "roast"
                  : type === "brews"
                    ? "brew"
                    : "brew or roast"}
                .
              </p>
              <Button asChild size="sm" className="mt-2">
                <Link href={type === "roasts" ? "/roast" : "/brew"}>
                  Start logging
                </Link>
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
              <CardDescription>
                {signedIn
                  ? "Popular people you don't follow yet."
                  : "Most-followed people on the bench."}
              </CardDescription>
            </CardHeader>
            {brewers.length === 0 ? (
              <p className="px-2 pb-2 text-sm text-muted">
                You follow everyone on the bench. Nice.
              </p>
            ) : (
              <ul className="flex flex-col gap-1">
                {brewers.map((u) => (
                  <BrewerRow key={u.id} user={u} signedIn={signedIn} compact />
                ))}
              </ul>
            )}
          </Card>
        </aside>
      </div>
    </div>
  );
}

type BrewerSummary = {
  id: string;
  name: string;
  isPro: boolean;
  _count: { extractions: number; roasts: number; followers: number };
};

function BrewerRow({
  user: u,
  signedIn,
  compact,
}: {
  user: BrewerSummary;
  signedIn: boolean;
  compact?: boolean;
}) {
  return (
    <li className="flex items-center gap-2 rounded-xl px-2 py-2 transition-colors hover:bg-titanium-2">
      <Link
        href={`/profile/${u.id}`}
        className="flex min-w-0 flex-1 items-center gap-3"
      >
        <span className="grid size-9 shrink-0 place-items-center rounded-full border border-teal/40 bg-teal/10 text-xs font-semibold text-teal-bright">
          {initials(u.name)}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5">
            <span className="truncate text-sm font-medium text-sterile">
              {u.name}
            </span>
            {u.isPro && <ProBadge />}
          </span>
          <span className="block truncate text-xs text-muted">
            {compact
              ? `${u._count.followers} followers`
              : `${u._count.followers} followers · ${u._count.extractions} brews · ${u._count.roasts} roasts`}
          </span>
        </span>
      </Link>
      <FollowButton
        targetUserId={u.id}
        initialFollowing={false}
        signedIn={signedIn}
        className={compact ? "min-w-0 px-2.5" : undefined}
      />
    </li>
  );
}
