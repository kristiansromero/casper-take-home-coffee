import { Coffee, Cog, Droplets, Flame, Scale, Thermometer, type LucideIcon } from "lucide-react";
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
}: {
  item: { category: string; name: string; blurb: string | null };
  className?: string;
}) {
  const Icon = ICONS[item.category] ?? Coffee;
  return (
    <div className={cn("glass flex gap-3 rounded-xl p-4", className)}>
      <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-teal/15 text-teal">
        <Icon className="size-5" aria-hidden />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-medium uppercase tracking-wider text-muted">{item.category}</p>
        <p className="font-medium text-sterile">{item.name}</p>
        {item.blurb && <p className="mt-1 text-sm text-muted">{item.blurb}</p>}
      </div>
    </div>
  );
}
