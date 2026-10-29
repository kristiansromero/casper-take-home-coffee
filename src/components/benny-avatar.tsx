import { Bean, Flame } from "lucide-react";
import { cn } from "@/lib/utils";

/** Benny's avatar: teal gradient disc with a coffee bean and a small flame. */
export function BennyAvatar({ size = "md", className }: { size?: "sm" | "md" | "lg"; className?: string }) {
  const dims = { sm: "size-8", md: "size-11", lg: "size-14" }[size];
  const icon = { sm: "size-4", md: "size-5", lg: "size-7" }[size];
  return (
    <span
      aria-hidden
      className={cn(
        "relative inline-grid shrink-0 place-items-center rounded-full bg-gradient-to-br from-teal-bright via-teal to-[#1f4f4d] text-obsidian shadow-[0_0_24px_-4px_rgba(71,145,143,0.7)] ring-1 ring-teal-bright/40",
        dims,
        className,
      )}
    >
      <Bean className={cn(icon, "-rotate-12")} strokeWidth={2.25} />
      <span className="absolute -bottom-0.5 -right-0.5 grid place-items-center rounded-full bg-amber p-0.5 ring-2 ring-obsidian">
        <Flame className="size-2.5 text-obsidian" strokeWidth={2.5} />
      </span>
    </span>
  );
}

/** "Benny | AI Coffee SME" identity lockup. */
export function BennyBadge({ size = "md", className }: { size?: "sm" | "md" | "lg"; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-3", className)}>
      <BennyAvatar size={size} />
      <span className="flex flex-col gap-1">
        <span className="font-semibold leading-none tracking-tight text-sterile">Benny</span>
        <span className="w-fit rounded-full border border-teal/40 bg-teal/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-teal-bright">
          AI Coffee SME
        </span>
      </span>
    </span>
  );
}
