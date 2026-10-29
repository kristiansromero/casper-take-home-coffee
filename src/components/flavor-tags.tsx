import { Tooltip } from "@/components/ui/tooltip";
import { tagColor, tagLabel } from "@/lib/sca-wheel";
import { cn } from "@/lib/utils";

function Chip({ tag }: { tag: string }) {
  const color = tagColor(tag);
  return (
    <span
      title={tag}
      className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium"
      style={{ borderColor: `${color}66`, backgroundColor: `${color}1f`, color }}
    >
      <span className="size-1.5 rounded-full" style={{ backgroundColor: color }} />
      {tagLabel(tag)}
    </span>
  );
}

/** Colored SCA flavor chips; shows the first `max` and a "+X more" chip with the rest on hover. */
export function FlavorTags({ tags, max = 5, className }: { tags: string[]; max?: number; className?: string }) {
  if (tags.length === 0) return null;
  const shown = tags.slice(0, max);
  const rest = tags.slice(max);

  return (
    <div className={cn("relative z-10 flex flex-wrap gap-1.5", className)}>
      {shown.map((tag) => (
        <Chip key={tag} tag={tag} />
      ))}
      {rest.length > 0 && (
        <Tooltip
          content={
            <div className="flex max-w-60 flex-wrap gap-1.5">
              {rest.map((tag) => (
                <Chip key={tag} tag={tag} />
              ))}
            </div>
          }
        >
          <button
            type="button"
            className="rounded-full border border-line bg-titanium-2 px-2.5 py-0.5 text-xs font-medium text-muted hover:text-sterile"
          >
            +{rest.length} more
          </button>
        </Tooltip>
      )}
    </div>
  );
}
