"use client";

import { useMemo, useState } from "react";
import { Dialog } from "radix-ui";
import { BookOpen, ExternalLink, Search, X } from "lucide-react";
import { ALL_WHEEL_PATHS, TAG_SEP, WCR_LEXICON_URL, nodeColor, tagLabel } from "@/lib/sca-wheel";
import { LEXICON_SOURCE_NOTE, lexiconEntry } from "@/lib/wcr-lexicon";
import { cn } from "@/lib/utils";

/** Unique attribute names on the wheel that have a lexicon entry, keyed to their first path. */
const LEXICON_PATHS: string[] = (() => {
  const seen = new Set<string>();
  return ALL_WHEEL_PATHS.filter((p) => {
    const name = tagLabel(p);
    if (seen.has(name) || !lexiconEntry(name)) return false;
    seen.add(name);
    return true;
  });
})();

/**
 * Right-side slide-over with WCR Sensory Lexicon summaries. Highlights the
 * `focusPath` attribute (the node the picker is currently on) and lists the rest.
 */
export function LexiconDrawer({
  open,
  onOpenChange,
  focusPath,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  focusPath?: string | null;
}) {
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState<string | null>(null);
  const current = picked ?? focusPath ?? null;
  const focused = current ? lexiconEntry(current) : undefined;

  const q = query.trim().toLowerCase();
  const list = useMemo(
    () =>
      q
        ? LEXICON_PATHS.filter((p) => {
            const e = lexiconEntry(p);
            return p.toLowerCase().includes(q) || e?.definition.toLowerCase().includes(q);
          })
        : LEXICON_PATHS,
    [q],
  );

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(o) => {
        if (!o) setPicked(null);
        onOpenChange(o);
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in" />
        <Dialog.Content
          className={cn(
            "fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-line bg-titanium shadow-2xl outline-none",
            "transition-transform duration-300 data-[state=closed]:translate-x-full",
          )}
          style={{ animation: open ? "lexicon-slide-in 260ms cubic-bezier(.2,.8,.2,1)" : undefined }}
        >
          <style>{`@keyframes lexicon-slide-in{from{transform:translateX(100%)}to{transform:translateX(0)}}`}</style>
          <header className="flex items-start gap-3 border-b border-line px-5 py-4">
            <BookOpen className="mt-0.5 size-5 text-teal-bright" aria-hidden />
            <div className="flex-1">
              <Dialog.Title className="text-base font-semibold text-sterile">WCR Sensory Lexicon</Dialog.Title>
              <Dialog.Description className="text-xs text-muted">{LEXICON_SOURCE_NOTE}</Dialog.Description>
            </div>
            <Dialog.Close
              className="grid size-8 place-items-center rounded-md text-muted hover:bg-titanium-2 hover:text-sterile focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal/60"
              aria-label="Close lexicon"
            >
              <X className="size-4" />
            </Dialog.Close>
          </header>

          {current && (
            <section className="border-b border-line px-5 py-4" aria-live="polite">
              <p className="text-[11px] uppercase tracking-wider text-muted">
                {current.split(TAG_SEP).slice(0, -1).join(" › ") || "Category"}
              </p>
              <h3 className="mt-1 flex items-center gap-2 text-lg font-semibold text-sterile">
                <span className="size-3 rounded-full" style={{ backgroundColor: nodeColor(current) }} aria-hidden />
                {tagLabel(current)}
              </h3>
              {focused ? (
                <>
                  <p className="mt-2 text-sm leading-relaxed text-sterile/90">{focused.definition}</p>
                  {focused.reference && (
                    <p className="mt-2 rounded-lg border border-line bg-obsidian/60 px-3 py-2 text-xs text-muted">
                      <span className="font-medium text-amber">Reference standard: </span>
                      {focused.reference}
                    </p>
                  )}
                </>
              ) : (
                <p className="mt-2 text-sm text-muted">No lexicon summary for this node yet — see the full lexicon.</p>
              )}
            </section>
          )}

          <div className="px-5 pt-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search attributes or definitions…"
                aria-label="Search lexicon"
                className="h-9 w-full rounded-lg border border-line bg-obsidian/70 pl-9 pr-3 text-sm text-sterile placeholder:text-muted/70 focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/30"
              />
            </div>
          </div>

          <ul className="flex-1 space-y-1 overflow-y-auto px-3 py-3">
            {list.length === 0 && <li className="px-2 text-xs text-muted">No attributes match “{query}”.</li>}
            {list.map((p) => {
              const e = lexiconEntry(p)!;
              const active = current != null && tagLabel(current) === tagLabel(p);
              return (
                <li key={p}>
                  <button
                    type="button"
                    onClick={() => setPicked(p)}
                    aria-current={active || undefined}
                    className={cn(
                      "w-full rounded-lg px-2 py-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal/60",
                      active ? "bg-titanium-2" : "hover:bg-titanium-2/60",
                    )}
                  >
                    <span className="flex items-center gap-2 text-sm font-medium text-sterile">
                      <span className="size-2 rounded-full" style={{ backgroundColor: nodeColor(p) }} aria-hidden />
                      {tagLabel(p)}
                      <span className="truncate text-[11px] font-normal text-muted">
                        {p.split(TAG_SEP).slice(0, -1).join(" › ")}
                      </span>
                    </span>
                    <span className="mt-0.5 line-clamp-2 block pl-4 text-xs text-muted">{e.definition}</span>
                  </button>
                </li>
              );
            })}
          </ul>

          <footer className="border-t border-line px-5 py-3 text-xs text-muted">
            <a
              href={WCR_LEXICON_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-teal-bright underline-offset-4 hover:underline"
            >
              Open the full WCR Sensory Lexicon
              <ExternalLink className="size-3.5" aria-hidden />
            </a>
            <p className="mt-1">Definitions paraphrased; see the lexicon for intensities and preparation.</p>
          </footer>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
