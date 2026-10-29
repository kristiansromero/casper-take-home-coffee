import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";

export function ProBadge({ className, label = "Pro" }: { className?: string; label?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-amber/50 bg-amber/15 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-amber",
        className,
      )}
    >
      <Lock className="size-3" aria-hidden />
      {label}
    </span>
  );
}
