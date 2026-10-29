"use client";

import { useMemo, useState } from "react";
import { Check, ChevronRight, ExternalLink, Plus, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  CATEGORY_COLORS,
  SCA_WHEEL,
  TAG_SEP,
  WCR_LEXICON_URL,
  tagColor,
  tagLabel,
  tagPath,
  type FlavorNode,
} from "@/lib/sca-wheel";

/** Every node of the wheel as a full path, for search. */
const ALL_PATHS: string[] = (() => {
  const out: string[] = [];
  const walk = (nodes: FlavorNode[], prefix: string[]) => {
    for (const node of nodes) {
      const path = [...prefix, node.name];
      out.push(tagPath(...path));
      if (node.children) walk(node.children, path);
    }
  };
  walk(SCA_WHEEL, []);
  return out;
})();

export function FlavorTagPicker({ value, onChange }: { value: string[]; onChange: (tags: string[]) => void }) {
  const [category, setCategory] = useState<string>(SCA_WHEEL[0].name);
  const [sub, setSub] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const selected = useMemo(() => new Set(value), [value]);
  const toggle = (path: string) =>
    onChange(selected.has(path) ? value.filter((t) => t !== path) : [...value, path]);

  const categoryNode = SCA_WHEEL.find((n) => n.name === category);
  const subNode = categoryNode?.children?.find((n) => n.name === sub);

  const q = query.trim().toLowerCase();
  const results = q ? ALL_PATHS.filter((p) => tagLabel(p).toLowerCase().includes(q)).slice(0, 40) : [];

  return (
    <div className="flex flex-col gap-3">
      <a
        href={WCR_LEXICON_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex w-fit items-center gap-1.5 text-sm text-teal-bright underline-offset-4 hover:underline"
      >
        Reference WCR Sensory Lexicon
        <ExternalLink className="size-3.5" aria-hidden />
      </a>

      {/* Selected chips */}
      <div className="flex min-h-9 flex-wrap items-center gap-1.5" aria-live="polite">
        {value.length === 0 ? (
          <p className="text-xs text-muted">No flavors selected — pick any tier of the SCA wheel below.</p>
        ) : (
          value.map((path) => (
            <button
              key={path}
              type="button"
              title={path}
              onClick={() => toggle(path)}
              aria-label={`Remove ${path}`}
              className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium text-sterile transition-colors hover:bg-titanium-2"
              style={{ borderColor: tagColor(path), backgroundColor: `${tagColor(path)}26` }}
            >
              <span className="size-1.5 rounded-full" style={{ backgroundColor: tagColor(path) }} />
              {tagLabel(path)}
              <X className="size-3 text-muted" aria-hidden />
            </button>
          ))
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search descriptors (e.g. jasmine, cocoa)…"
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
              {results.map((path) => (
                <li key={path}>
                  <TagRow
                    label={tagLabel(path)}
                    detail={path.split(TAG_SEP).slice(0, -1).join(TAG_SEP)}
                    color={tagColor(path)}
                    selected={selected.has(path)}
                    onToggle={() => toggle(path)}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        <div className="grid gap-2 sm:grid-cols-3">
          <Pane title="Category">
            {SCA_WHEEL.map((node) => {
              const path = tagPath(node.name);
              return (
                <TagRow
                  key={path}
                  label={node.name}
                  color={CATEGORY_COLORS[node.name]}
                  selected={selected.has(path)}
                  active={category === node.name}
                  onOpen={() => {
                    setCategory(node.name);
                    setSub(null);
                  }}
                  onToggle={() => toggle(path)}
                />
              );
            })}
          </Pane>

          <Pane title="Subcategory">
            {categoryNode?.children?.map((node) => {
              const path = tagPath(category, node.name);
              return (
                <TagRow
                  key={path}
                  label={node.name}
                  color={tagColor(path)}
                  selected={selected.has(path)}
                  active={sub === node.name}
                  onOpen={node.children ? () => setSub(node.name) : undefined}
                  onToggle={() => toggle(path)}
                />
              );
            })}
          </Pane>

          <Pane title="Descriptor">
            {subNode?.children ? (
              subNode.children.map((node) => {
                const path = tagPath(category, subNode.name, node.name);
                return (
                  <TagRow
                    key={path}
                    label={node.name}
                    color={tagColor(path)}
                    selected={selected.has(path)}
                    onToggle={() => toggle(path)}
                  />
                );
              })
            ) : (
              <p className="p-2 text-xs text-muted">
                {sub ? "No finer descriptors — add the subcategory itself." : "Open a subcategory to see descriptors."}
              </p>
            )}
          </Pane>
        </div>
      )}
    </div>
  );
}

function Pane({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col rounded-xl border border-line bg-obsidian/50">
      <p className="border-b border-line px-3 py-2 text-[11px] font-medium uppercase tracking-wider text-muted">{title}</p>
      <div className="flex max-h-64 flex-col gap-0.5 overflow-y-auto p-1.5">{children}</div>
    </div>
  );
}

/**
 * One wheel node. Branches have two controls: the label opens the next tier, the
 * trailing button adds the branch itself as a tag. Leaves toggle on click.
 */
function TagRow({
  label,
  detail,
  color,
  selected,
  active,
  onOpen,
  onToggle,
}: {
  label: string;
  detail?: string;
  color: string;
  selected: boolean;
  active?: boolean;
  onOpen?: () => void;
  onToggle: () => void;
}) {
  const swatch = <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: color }} aria-hidden />;

  if (!onOpen) {
    return (
      <button
        type="button"
        aria-pressed={selected}
        onClick={onToggle}
        className={cn(
          "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal/60",
          selected ? "bg-titanium-2 text-sterile" : "text-sterile/85 hover:bg-titanium-2/60",
        )}
      >
        {swatch}
        <span className="flex-1 truncate">
          {label}
          {detail && <span className="ml-1.5 text-xs text-muted">{detail}</span>}
        </span>
        {selected ? <Check className="size-4 text-teal-bright" aria-hidden /> : <Plus className="size-4 text-muted" aria-hidden />}
      </button>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center rounded-lg transition-colors",
        active ? "bg-titanium-2" : "hover:bg-titanium-2/60",
      )}
    >
      <button
        type="button"
        onClick={onOpen}
        aria-expanded={active}
        className="flex flex-1 items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm text-sterile focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal/60"
        style={active ? { color } : undefined}
      >
        {swatch}
        <span className="flex-1 truncate">{label}</span>
        <ChevronRight className="size-3.5 text-muted" aria-hidden />
      </button>
      <button
        type="button"
        aria-pressed={selected}
        aria-label={selected ? `Remove ${label}` : `Add ${label}`}
        title={selected ? `Remove ${label}` : `Add “${label}”`}
        onClick={onToggle}
        className={cn(
          "mr-1 grid size-7 place-items-center rounded-md border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal/60",
          selected ? "border-teal bg-teal/20 text-teal-bright" : "border-line text-muted hover:text-sterile",
        )}
      >
        {selected ? <Check className="size-3.5" aria-hidden /> : <Plus className="size-3.5" aria-hidden />}
      </button>
    </div>
  );
}
