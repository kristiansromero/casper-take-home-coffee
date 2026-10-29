import "server-only";
import type { Prisma } from "@prisma/client";
import type { FeedItem } from "@/components/feed-item-card";
import type { CurvePoint } from "@/lib/mock-curve";

const userSelect = { select: { id: true, name: true, handle: true } } as const;

export const feedInclude = {
  user: userSelect,
  bean: { include: { roaster: true } },
} satisfies Prisma.ExtractionInclude & Prisma.RoastInclude;

type ExtractionRow = Prisma.ExtractionGetPayload<{ include: typeof feedInclude }>;
type RoastRow = Prisma.RoastGetPayload<{ include: typeof feedInclude }>;

export function brewToFeedItem(e: ExtractionRow): FeedItem {
  return {
    kind: "brew",
    id: e.id,
    createdAt: e.createdAt,
    user: e.user,
    beanName: e.bean.name,
    roasterName: e.bean.roaster.name,
    method: e.method,
    doseG: e.doseG,
    yieldG: e.yieldG,
    timeSec: e.timeSec,
    tempC: e.tempC,
    rating: e.rating,
    flavorTags: e.flavorTags,
  };
}

export function roastToFeedItem(r: RoastRow): FeedItem {
  return {
    kind: "roast",
    id: r.id,
    createdAt: r.createdAt,
    user: r.user,
    beanName: r.bean.name,
    roasterName: r.bean.roaster.name,
    machineName: r.machineName,
    firstCrackSec: r.firstCrackSec,
    dropSec: r.dropSec,
    dropTempC: r.dropTempC,
    flavorTags: r.flavorTags,
    curve: Array.isArray(r.curve) ? (r.curve as unknown as CurvePoint[]) : [],
  };
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/** Merge brews and roasts into one list, newest first. */
export function mergeFeed(brews: ExtractionRow[], roasts: RoastRow[]): FeedItem[] {
  return [...brews.map(brewToFeedItem), ...roasts.map(roastToFeedItem)].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
  );
}
