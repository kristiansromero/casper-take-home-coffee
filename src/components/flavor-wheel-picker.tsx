"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, BookOpen, Check, ChevronRight, Plus, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  ALL_WHEEL_PATHS,
  CATEGORY_COLORS,
  SCA_WHEEL,
  TAG_SEP,
  displayLabel,
  displayPath,
  displaySegments,
  dominantCategoryColor,
  findNode,
  isLightColor,
  nodeColor,
  readableTint,
  type FlavorNode,
} from "@/lib/sca-wheel";
import { BorderGlow } from "@/components/border-glow";
import { LexiconDrawer } from "@/components/lexicon-drawer";

export type FlavorNote = { category: string; subCategory?: string; attribute?: string; color: string };

const noteToPath = (n: FlavorNote) => [n.category, n.subCategory, n.attribute].filter(Boolean).join(TAG_SEP);

export function notesToPaths(notes: FlavorNote[]): string[] {
  return notes.map(noteToPath);
}

export function pathsToNotes(paths: string[]): FlavorNote[] {
  return paths.map((p) => {
    const [category, subCategory, attribute] = p.split(TAG_SEP);
    return { category, subCategory, attribute, color: nodeColor(p) };
  });
}

const pathToNote = (p: string) => pathsToNotes([p])[0];
const crumbs = (p: string) => displayPath(p);

/**
 * Center-out SCA flavor wheel picker: start at the nine core categories, drill
 * into subcategories and descriptors. Any tier can be selected.
 */
export function FlavorWheelPicker({
  value,
  onChange,
  max = 30,
}: {
  value: FlavorNote[];
  onChange: (notes: FlavorNote[]) => void;
  max?: number;
}) {
  const [trail, setTrail] = useState<string[]>([]); // current branch, [] = wheel center
  const [query, setQuery] = useState("");
  const [focus, setFocus] = useState<string | null>(null);
  const [lexiconOpen, setLexiconOpen] = useState(false);
  const reduce = useReducedMotion();

  const paths = useMemo(() => notesToPaths(value), [value]);
  const selected = useMemo(() => new Set(paths), [paths]);
  const atMax = value.length >= max;

  const toggle = (path: string) => {
    if (selected.has(path)) onChange(value.filter((n) => noteToPath(n) !== path));
    else if (!atMax) onChange([...value, pathToNote(path)]);
    setFocus(path);
  };

  const branchPath = trail.join(TAG_SEP);
  const branch = trail.length ? findNode(branchPath) : undefined;
  const nodes: FlavorNode[] = branch?.children ?? SCA_WHEEL;

  const goTo = (path: string) => {
    const parts = path.split(TAG_SEP);
    const node = findNode(path);
    // Navigate to the node's branch if it has children, else to its parent.
    setTrail(node?.children ? parts : parts.slice(0, -1));
    setFocus(path);
    setQuery("");
  };

  const q = query.trim().toLowerCase();
  const results = q ? ALL_WHEEL_PATHS.filter((p) => displayLabel(p).toLowerCase().includes(q)).slice(0, 40) : [];

  // Category mix for the profile bar.
  const mix = useMemo(() => {
    const counts = new Map<string, number>();
    for (const n of value) counts.set(n.category, (counts.get(n.category) ?? 0) + 1);
    return SCA_WHEEL.map((c) => ({ name: c.name, count: counts.get(c.name) ?? 0 })).filter((c) => c.count > 0);
  }, [value]);

  const tierLabel = ["Core category", "Subcategory", "Descriptor"][trail.length] ?? "Descriptor";

  const glowColor = dominantCategoryColor(paths) ?? "#47918F";

  return (
    <BorderGlow className="flex flex-col gap-4" glowColor={glowColor} radius={16}>
      {/* Top row: lexicon link + count */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setLexiconOpen(true)}
          className="inline-flex items-center gap-1.5 rounded text-sm text-teal-bright underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal/60"
        >
          <BookOpen className="size-3.5" aria-hidden />
          Reference WCR Sensory Lexicon
        </button>
        <span className={cn("text-xs tabular-nums", atMax ? "text-amber" : "text-muted")}>
          {value.length}/{max} notes
        </span>
      </div>

      {/* Selected chips */}
      <div className="flex min-h-9 flex-wrap items-center gap-1.5" aria-live="polite">
        {value.length === 0 ? (
          <p className="text-xs text-muted">
            Start at the center: pick a core category, then drill outward as far as you can taste.
          </p>
        ) : (
          <AnimatePresence initial={false}>
            {value.map((note) => {
              const path = noteToPath(note);
              return (
                <motion.span
                  key={path}
                  layout={!reduce}
                  initial={reduce ? false : { opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={reduce ? undefined : { opacity: 0, scale: 0.85 }}
                  className="inline-flex items-center overflow-hidden rounded-full border text-xs font-medium text-sterile"
                  style={{ borderColor: `${note.color}99`, backgroundColor: `${note.color}1A` }}
                >
                  <button
                    type="button"
                    onClick={() => goTo(path)}
                    title={`Go to ${crumbs(path)}`}
                    className="inline-flex items-center gap-1.5 py-1 pl-2.5 pr-1 hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-teal/60"
                  >
                    <span className="size-2 rounded-full" style={{ backgroundColor: note.color }} aria-hidden />
                    {displaySegments(path).map((part, i, arr) => (
                      <span key={i} className={i < arr.length - 1 ? "text-muted" : "text-sterile"}>
                        {part}
                        {i < arr.length - 1 && <span className="mx-0.5 text-muted/60">›</span>}
                      </span>
                    ))}
                  </button>
                  <button
                    type="button"
                    onClick={() => toggle(path)}
                    aria-label={`Remove ${crumbs(path)}`}
                    className="grid h-full place-items-center px-1.5 py-1 text-muted hover:bg-white/10 hover:text-sterile focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-teal/60"
                  >
                    <X className="size-3" aria-hidden />
                  </button>
                </motion.span>
              );
            })}
          </AnimatePresence>
        )}
      </div>

      {/* Profile bar */}
      {mix.length > 0 && (
        <div>
          <p className="mb-1 text-[11px] uppercase tracking-wider text-muted">Selected profile</p>
          <div className="flex h-2 w-full overflow-hidden rounded-full bg-obsidian" role="img" aria-label={`Profile: ${mix.map((m) => `${m.name} ${m.count}`).join(", ")}`}>
            {mix.map((m) => (
              <motion.div
                key={m.name}
                layout={!reduce}
                title={`${m.name} · ${m.count}`}
                style={{ flexGrow: m.count, backgroundColor: CATEGORY_COLORS[m.name] }}
                className="h-full"
              />
            ))}
          </div>
          <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5">
            {mix.map((m) => (
              <span key={m.name} className="inline-flex items-center gap-1 text-[11px] text-muted">
                <span className="size-1.5 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[m.name] }} />
                {m.name} {m.count}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search all tiers (e.g. jasmine, cocoa, citrus)…"
          aria-label="Search flavor descriptors"
          className="h-10 w-full rounded-lg border border-line bg-obsidian/70 pl-9 pr-3 text-sm text-sterile placeholder:text-muted/70 focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/30"
        />
      </div>

      {q ? (
        <div className="rounded-xl border border-line bg-obsidian/50 p-2">
          {results.length === 0 ? (
            <p className="p-2 text-xs text-muted">No descriptors match “{query}”.</p>
          ) : (
            <ul className="grid gap-1 sm:grid-cols-2">
              {results.map((path) => {
                const on = selected.has(path);
                return (
                  <li key={path}>
                    <button
                      type="button"
                      aria-pressed={on}
                      disabled={!on && atMax}
                      onClick={() => toggle(path)}
                      className={cn(
                        "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal/60 disabled:opacity-40",
                        on ? "bg-titanium-2 text-sterile" : "text-sterile/85 hover:bg-titanium-2/60",
                      )}
                    >
                      <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: nodeColor(path) }} aria-hidden />
                      <span className="flex-1 truncate">
                        {displayLabel(path)}
                        <span className="ml-1.5 text-xs text-muted">{crumbs(path.split(TAG_SEP).slice(0, -1).join(TAG_SEP))}</span>
                      </span>
                      {on ? <Check className="size-4 text-teal-bright" aria-hidden /> : <Plus className="size-4 text-muted" aria-hidden />}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ) : (
        <div className="relative overflow-hidden rounded-2xl border border-line bg-obsidian/50 p-3">
          {/* Breadcrumb + back + select-branch */}
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setTrail((t) => t.slice(0, -1))}
              disabled={trail.length === 0}
              aria-label="Back one tier"
              className="grid size-8 place-items-center rounded-md border border-line text-muted transition-colors hover:text-sterile focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal/60 disabled:opacity-30"
            >
              <ArrowLeft className="size-4" aria-hidden />
            </button>
            <nav aria-label="Flavor wheel tier" className="flex min-w-0 flex-1 flex-wrap items-center gap-1 text-sm">
              <button
                type="button"
                onClick={() => setTrail([])}
                className={cn(
                  "rounded px-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal/60",
                  trail.length ? "text-muted hover:text-sterile" : "font-medium text-sterile",
                )}
              >
                Wheel
              </button>
              {trail.map((name, i) => {
                const p = trail.slice(0, i + 1).join(TAG_SEP);
                const last = i === trail.length - 1;
                // Collapse a repeated name ("Floral > Floral") unless it is the current tier.
                if (!last && i > 0 && name === trail[i - 1]) return null;
                return (
                  <span key={p} className="inline-flex items-center gap-1">
                    <ChevronRight className="size-3.5 text-muted/60" aria-hidden />
                    <button
                      type="button"
                      onClick={() => setTrail(trail.slice(0, i + 1))}
                      aria-current={last ? "page" : undefined}
                      className="rounded px-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal/60"
                      style={{ color: last ? readableTint(nodeColor(p)) : undefined }}
                    >
                      {displayLabel(p)}
                    </button>
                  </span>
                );
              })}
            </nav>
            {trail.length > 0 && (
              <button
                type="button"
                aria-pressed={selected.has(branchPath)}
                disabled={!selected.has(branchPath) && atMax}
                onClick={() => toggle(branchPath)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal/60 disabled:opacity-40",
                  selected.has(branchPath)
                    ? isLightColor(nodeColor(branchPath)) ? "text-obsidian" : "text-sterile"
                    : "text-sterile hover:bg-titanium-2",
                )}
                style={{
                  borderColor: nodeColor(branchPath),
                  backgroundColor: selected.has(branchPath) ? nodeColor(branchPath) : "transparent",
                }}
              >
                {selected.has(branchPath) ? <Check className="size-3.5" aria-hidden /> : <Plus className="size-3.5" aria-hidden />}
                {selected.has(branchPath) ? "Selected" : `Select “${displayLabel(branchPath)}”`}
              </button>
            )}
          </div>

          <p className="mb-2 text-[11px] uppercase tracking-wider text-muted">{tierLabel}</p>

          <AnimatePresence mode="wait" initial={false}>
            <motion.ul
              key={branchPath || "root"}
              initial={reduce ? false : { opacity: 0, scale: 0.92, filter: "blur(4px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              exit={reduce ? undefined : { opacity: 0, scale: 1.06, filter: "blur(4px)" }}
              transition={{ duration: 0.22, ease: [0.2, 0.8, 0.2, 1] }}
              className={cn(
                "grid gap-2",
                trail.length === 0 ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4",
              )}
            >
              {nodes.map((node, i) => {
                const path = [...trail, node.name].join(TAG_SEP);
                return (
                  <motion.li
                    key={path}
                    initial={reduce ? false : { opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: reduce ? 0 : i * 0.025, duration: 0.2 }}
                  >
                    <WheelTile
                      node={node}
                      path={path}
                      large={trail.length === 0}
                      selected={selected.has(path)}
                      disabled={atMax}
                      onOpen={node.children ? () => {
                        setTrail([...trail, node.name]);
                        setFocus(path);
                      } : undefined}
                      onToggle={() => toggle(path)}
                    />
                  </motion.li>
                );
              })}
            </motion.ul>
          </AnimatePresence>
        </div>
      )}

      <LexiconDrawer open={lexiconOpen} onOpenChange={setLexiconOpen} focusPath={focus ?? (branchPath || null)} />
    </BorderGlow>
  );
}

/**
 * One wheel node as a colored tile. Branch tiles open the next tier on click and
 * carry a corner toggle to select the branch itself; leaf tiles toggle.
 */
function WheelTile({
  node,
  path,
  large,
  selected,
  disabled,
  onOpen,
  onToggle,
}: {
  node: FlavorNode;
  path: string;
  large: boolean;
  selected: boolean;
  disabled: boolean;
  onOpen?: () => void;
  onToggle: () => void;
}) {
  const color = nodeColor(path);
  const label = displayLabel(path);
  const count = node.children?.length;
  const onColor = isLightColor(color) ? "text-obsidian" : "text-sterile";

  const face = (
    <>
      <span
        className="pointer-events-none absolute inset-0 opacity-90"
        style={{ background: `radial-gradient(120% 120% at 0% 0%, ${color}55 0%, ${color}14 55%, transparent 100%)` }}
        aria-hidden
      />
      <span
        className="pointer-events-none absolute -right-6 -top-6 size-16 rounded-full opacity-40 blur-xl"
        style={{ backgroundColor: color }}
        aria-hidden
      />
      <span className="relative flex items-center gap-2">
        <span className="size-3 shrink-0 rounded-full ring-2 ring-black/30" style={{ backgroundColor: color }} aria-hidden />
        <span className={cn("font-semibold leading-tight text-sterile", large ? "text-base" : "text-sm")}>{label}</span>
      </span>
      {onOpen && (
        <span className="relative mt-auto inline-flex items-center gap-0.5 text-[11px] text-muted">
          {count} {count === 1 ? "note" : "notes"}
          <ChevronRight className="size-3" aria-hidden />
        </span>
      )}
    </>
  );

  const ring = selected ? { borderColor: color, boxShadow: `0 0 0 1px ${color}, 0 0 18px -4px ${color}` } : undefined;
  const base = cn(
    "group relative flex w-full flex-col items-start gap-2 overflow-hidden rounded-xl border border-line bg-titanium/60 p-3 text-left transition-[transform,border-color,box-shadow] duration-150 hover:-translate-y-0.5 hover:border-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal/70",
    large ? "min-h-24" : "min-h-16",
  );

  if (!onOpen) {
    return (
      <button
        type="button"
        aria-pressed={selected}
        disabled={!selected && disabled}
        onClick={onToggle}
        className={cn(base, "disabled:opacity-40")}
        style={ring}
      >
        {face}
        <span
          className="absolute right-2 top-2 grid size-6 place-items-center rounded-full border border-line bg-obsidian/60"
          style={selected ? { backgroundColor: color, borderColor: color } : undefined}
          aria-hidden
        >
          {selected ? <Check className={cn("size-3.5", onColor)} /> : <Plus className="size-3.5 text-muted" />}
        </span>
      </button>
    );
  }

  return (
    <div className="relative">
      <button type="button" onClick={onOpen} aria-label={`Open ${label}`} className={base} style={ring}>
        {face}
      </button>
      <button
        type="button"
        aria-pressed={selected}
        aria-label={selected ? `Remove ${label}` : `Select ${label}`}
        title={selected ? `Remove ${label}` : `Select “${label}”`}
        disabled={!selected && disabled}
        onClick={onToggle}
        className="absolute right-2 top-2 grid size-7 place-items-center rounded-full border border-line bg-obsidian/70 text-muted transition-colors hover:text-sterile focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal/70 disabled:opacity-40"
        style={selected ? { backgroundColor: color, borderColor: color } : undefined}
      >
        {selected ? <Check className={cn("size-3.5", onColor)} aria-hidden /> : <Plus className="size-3.5" aria-hidden />}
      </button>
    </div>
  );
}
