import {
  Coffee,
  Cog,
  Droplets,
  Flame,
  Scale,
  Thermometer,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ICONS: Record<string, LucideIcon> = {
  grinder: Cog,
  brewer: Droplets,
  espresso: Coffee,
  roaster: Flame,
  kettle: Thermometer,
  scale: Scale,
};

export function EquipmentCard({
  item,
  className,
  usage,
}: {
  item: { category: string; name: string; blurb: string | null };
  className?: string;
  /** How many logged brews / roasts used this piece of kit. */
  usage?: { brews: number; roasts: number };
}) {
  const Icon = ICONS[item.category] ?? Coffee;
  return (
    <div className={cn("glass flex gap-3 rounded-xl p-4", className)}>
      <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-teal/15 text-teal">
        <Icon className="size-5" aria-hidden />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-medium uppercase tracking-wider text-muted">
          {item.category}
        </p>
        <p className="font-medium text-sterile">{item.name}</p>
        {item.blurb && <p className="mt-1 text-sm text-muted">{item.blurb}</p>}
        {usage && (usage.brews > 0 || usage.roasts > 0) && (
          <p className="mt-2 flex flex-wrap gap-3 font-mono text-xs tabular-nums">
            {usage.brews > 0 && (
              <span className="inline-flex items-center gap-1 text-teal-bright">
                <Coffee className="size-3" aria-hidden /> {usage.brews}{" "}
                {usage.brews === 1 ? "brew" : "brews"}
              </span>
            )}
            {usage.roasts > 0 && (
              <span className="inline-flex items-center gap-1 text-amber">
                <Flame className="size-3" aria-hidden /> {usage.roasts}{" "}
                {usage.roasts === 1 ? "roast" : "roasts"}
              </span>
            )}
          </p>
        )}
      </div>
    </div>
  );
}
