"use client";

import { useRef, useState } from "react";
import { Bold, CheckSquare, FileText, Flame, Heading, Italic, List, Sigma, SquareFunction } from "lucide-react";
import { Markdown } from "@/components/markdown";
import { cn } from "@/lib/utils";

const BREW_TEMPLATE = `## Brew log

| Pour | Time | Water (g) | Notes |
| --- | --- | --- | --- |
| Bloom | 0:00 | 45 | swirl |
| 1 | 0:45 | 150 | center spiral |
| 2 | 1:30 | 250 | gentle |

**Ratio:** $1{:}16.7$ · **Drawdown:** 3:15

- [ ] Rinse filter & preheat
- [ ] Grind right before brewing
- [ ] Taste at 60 °C and again cool

> Next time:
`;

const ROAST_LOG = `## Roast log

| Phase | End | Duration | Share |
| --- | --- | --- | --- |
| Drying | 4:30 | 4:30 | 45% |
| Maillard | 8:00 | 3:30 | 35% |
| Development | 10:00 | 2:00 | 20% |

$$DTR = \\frac{t_{drop} - t_{FC}}{t_{drop}} \\times 100\\%$$

- [ ] Charge temp hit
- [ ] RoR declining into FC
- [ ] Weight loss: $\\frac{green - roasted}{green}$ = __%

> Adjust:
`;

type Action = { label: string; icon: typeof Bold; run: (sel: string) => { text: string; select?: [number, number] } };

const wrap = (pre: string, post: string, placeholder: string) => (sel: string) => {
  const inner = sel || placeholder;
  return { text: `${pre}${inner}${post}`, select: [pre.length, pre.length + inner.length] as [number, number] };
};
const prefixLines = (prefix: string, placeholder: string) => (sel: string) => {
  const body = (sel || placeholder)
    .split("\n")
    .map((l) => `${prefix}${l}`)
    .join("\n");
  return { text: body, select: sel ? undefined : ([prefix.length, body.length] as [number, number]) };
};

const ACTIONS: Action[] = [
  { label: "Bold", icon: Bold, run: wrap("**", "**", "bold") },
  { label: "Italic", icon: Italic, run: wrap("_", "_", "italic") },
  { label: "Heading", icon: Heading, run: prefixLines("## ", "Heading") },
  { label: "Bulleted list", icon: List, run: prefixLines("- ", "item") },
  { label: "Checklist", icon: CheckSquare, run: prefixLines("- [ ] ", "step") },
  { label: "Inline math ($…$)", icon: Sigma, run: wrap("$", "$", "EY = \\frac{TDS \\times yield}{dose}") },
  { label: "Block math ($$…$$)", icon: SquareFunction, run: wrap("\n$$\n", "\n$$\n", "\\text{ratio} = \\frac{water}{dose}") },
];

export function NotesEditor({
  value,
  onChange,
  placeholder,
  id,
  maxLength = 4000,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  id?: string;
  maxLength?: number;
}) {
  const [tab, setTab] = useState<"write" | "preview">("write");
  const ref = useRef<HTMLTextAreaElement>(null);

  function insert(make: (sel: string) => { text: string; select?: [number, number] }) {
    const el = ref.current;
    const start = el?.selectionStart ?? value.length;
    const end = el?.selectionEnd ?? value.length;
    const { text, select } = make(value.slice(start, end));
    const next = (value.slice(0, start) + text + value.slice(end)).slice(0, maxLength);
    onChange(next);
    setTab("write");
    requestAnimationFrame(() => {
      const t = ref.current;
      if (!t) return;
      t.focus();
      if (select) t.setSelectionRange(start + select[0], start + select[1]);
      else t.setSelectionRange(start + text.length, start + text.length);
    });
  }

  function insertTemplate(tpl: string) {
    insert(() => {
      const el = ref.current;
      const start = el?.selectionStart ?? value.length;
      const lead = start > 0 && value[start - 1] !== "\n" ? "\n\n" : "";
      return { text: lead + tpl };
    });
  }

  const count = value.length;
  const tabBtn = (t: "write" | "preview", label: string) => (
    <button
      type="button"
      role="tab"
      aria-selected={tab === t}
      onClick={() => setTab(t)}
      className={cn(
        "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
        tab === t ? "bg-titanium-2 text-sterile" : "text-muted hover:text-sterile",
      )}
    >
      {label}
    </button>
  );

  return (
    <div className="overflow-hidden rounded-lg border border-line bg-obsidian/70 focus-within:border-teal focus-within:ring-2 focus-within:ring-teal/30">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-titanium/60 px-2 py-1.5">
        <div role="tablist" className="flex gap-1">
          {tabBtn("write", "Write")}
          {tabBtn("preview", "Preview")}
        </div>
        <div className="flex flex-wrap items-center gap-0.5">
          {ACTIONS.map(({ label, icon: Icon, run }) => (
            <button
              key={label}
              type="button"
              title={label}
              aria-label={label}
              onClick={() => insert(run)}
              className="rounded-md p-1.5 text-muted transition-colors hover:bg-titanium-2 hover:text-teal-bright"
            >
              <Icon className="size-3.5" aria-hidden />
            </button>
          ))}
          <span className="mx-1 h-4 w-px bg-line" aria-hidden />
          <button
            type="button"
            onClick={() => insertTemplate(BREW_TEMPLATE)}
            className="flex items-center gap-1 rounded-md px-1.5 py-1 text-[11px] font-medium text-muted hover:bg-titanium-2 hover:text-teal-bright"
          >
            <FileText className="size-3.5" aria-hidden /> Brew log
          </button>
          <button
            type="button"
            onClick={() => insertTemplate(ROAST_LOG)}
            className="flex items-center gap-1 rounded-md px-1.5 py-1 text-[11px] font-medium text-muted hover:bg-titanium-2 hover:text-amber"
          >
            <Flame className="size-3.5" aria-hidden /> Roast log
          </button>
        </div>
      </div>

      {tab === "write" ? (
        <textarea
          ref={ref}
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          maxLength={maxLength}
          rows={8}
          spellCheck
          className="block min-h-40 w-full resize-y bg-transparent px-3 py-2 font-mono text-[13px] leading-relaxed text-sterile placeholder:text-muted/70 focus:outline-none"
        />
      ) : (
        <div className="min-h-40 px-3 py-2">
          {value.trim() ? <Markdown>{value}</Markdown> : <p className="text-sm text-muted">Nothing to preview yet.</p>}
        </div>
      )}

      <div className="flex items-center justify-between border-t border-line/70 px-3 py-1.5 text-[11px] text-muted">
        <span>Markdown + LaTeX supported</span>
        <span className={cn("font-mono tabular-nums", count > maxLength * 0.9 && "text-amber")}>
          {count}/{maxLength}
        </span>
      </div>
    </div>
  );
}
