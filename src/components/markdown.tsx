import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { cn } from "@/lib/utils";

const components: Components = {
  h1: ({ node: _n, className, ...p }) => <h3 className={cn("mt-5 mb-2 text-lg font-semibold text-sterile first:mt-0", className)} {...p} />,
  h2: ({ node: _n, className, ...p }) => <h4 className={cn("mt-5 mb-2 text-base font-semibold text-sterile first:mt-0", className)} {...p} />,
  h3: ({ node: _n, className, ...p }) => <h5 className={cn("mt-4 mb-1.5 text-sm font-semibold uppercase tracking-wider text-teal-bright first:mt-0", className)} {...p} />,
  h4: ({ node: _n, className, ...p }) => <h6 className={cn("mt-3 mb-1 text-sm font-semibold text-sterile first:mt-0", className)} {...p} />,
  h5: ({ node: _n, className, ...p }) => <h6 className={cn("mt-3 mb-1 text-sm font-medium text-sterile first:mt-0", className)} {...p} />,
  h6: ({ node: _n, className, ...p }) => <h6 className={cn("mt-3 mb-1 text-xs font-medium text-muted first:mt-0", className)} {...p} />,
  p: ({ node: _n, className, ...p }) => <p className={cn("my-2 leading-relaxed first:mt-0 last:mb-0", className)} {...p} />,
  a: ({ node: _n, className, ...p }) => (
    <a className={cn("text-teal-bright underline underline-offset-2 hover:text-teal", className)} target="_blank" rel="noopener noreferrer nofollow" {...p} />
  ),
  strong: ({ node: _n, className, ...p }) => <strong className={cn("font-semibold text-sterile", className)} {...p} />,
  em: ({ node: _n, className, ...p }) => <em className={cn("italic text-sterile/90", className)} {...p} />,
  ul: ({ node: _n, className, ...p }) => (
    <ul
      className={cn(
        "my-2 list-disc space-y-1 pl-5 marker:text-teal/70",
        className?.includes("contains-task-list") && "list-none pl-0",
        className,
      )}
      {...p}
    />
  ),
  ol: ({ node: _n, className, ...p }) => <ol className={cn("my-2 list-decimal space-y-1 pl-5 marker:text-muted", className)} {...p} />,
  li: ({ node: _n, className, ...p }) => (
    <li className={cn("leading-relaxed", className?.includes("task-list-item") && "flex items-start gap-2", className)} {...p} />
  ),
  input: ({ node: _n, className, type, ...p }) =>
    type === "checkbox" ? (
      <input type="checkbox" disabled className={cn("mt-1 size-3.5 shrink-0 accent-teal", className)} {...p} />
    ) : (
      <input type={type} className={className} {...p} />
    ),
  blockquote: ({ node: _n, className, ...p }) => (
    <blockquote className={cn("my-3 border-l-2 border-amber/60 bg-amber/5 py-1 pl-3 text-sterile/80 italic", className)} {...p} />
  ),
  hr: ({ node: _n, className, ...p }) => <hr className={cn("my-4 border-line", className)} {...p} />,
  pre: ({ node: _n, className, ...p }) => (
    <pre className={cn("my-3 overflow-x-auto rounded-lg border border-line bg-obsidian/80 p-3 font-mono text-xs leading-relaxed text-sterile/90", className)} {...p} />
  ),
  code: ({ node: _n, className, ...p }) => {
    const isBlock = /language-/.test(className ?? "");
    return (
      <code
        className={cn(
          isBlock ? "font-mono" : "rounded bg-titanium-2/80 px-1 py-0.5 font-mono text-[0.85em] text-teal-bright",
          className,
        )}
        {...p}
      />
    );
  },
  table: ({ node: _n, className, ...p }) => (
    <div className="my-3 overflow-x-auto rounded-lg border border-line">
      <table className={cn("w-full border-collapse text-left text-xs", className)} {...p} />
    </div>
  ),
  thead: ({ node: _n, className, ...p }) => <thead className={cn("bg-titanium-2/60", className)} {...p} />,
  th: ({ node: _n, className, ...p }) => (
    <th className={cn("border-b border-line px-3 py-2 font-mono text-[11px] font-medium uppercase tracking-wider text-muted", className)} {...p} />
  ),
  td: ({ node: _n, className, ...p }) => <td className={cn("border-b border-line/50 px-3 py-1.5 font-mono tabular-nums", className)} {...p} />,
  img: () => null,
};

/** Renders user notes as Markdown (GFM) + LaTeX math (KaTeX). Raw HTML is skipped. */
export function Markdown({ children, className }: { children: string; className?: string }) {
  return (
    <div
      className={cn(
        "markdown-body min-w-0 break-words text-sm text-sterile/90",
        "[&_.katex]:text-sterile [&_.katex-display]:my-3 [&_.katex-display]:overflow-x-auto [&_.katex-display]:overflow-y-hidden [&_.katex-display]:rounded-lg [&_.katex-display]:border [&_.katex-display]:border-teal/20 [&_.katex-display]:bg-teal/5 [&_.katex-display]:px-3 [&_.katex-display]:py-2",
        className,
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[[rehypeKatex, { throwOnError: false, strict: "ignore" }]]}
        skipHtml
        components={components}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}

/** Strips common Markdown/LaTeX syntax for short plain-text snippets. */
export function markdownToPlain(src: string): string {
  return src
    .replace(/\$\$[\s\S]*?\$\$/g, " ")
    .replace(/\$([^$\n]+)\$/g, "$1")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/^\s*\|.*\|\s*$/gm, " ")
    .replace(/^\s{0,3}(#{1,6}|>|[-*+]\s+\[[ xX]\]|[-*+]|\d+\.)\s*/gm, "")
    .replace(/[*_`~]+/g, "")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}
