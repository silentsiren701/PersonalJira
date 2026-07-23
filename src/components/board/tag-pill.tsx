import { STICKY_COLOR_CLASSES, type Tag } from "@/lib/types";
import { cn } from "@/lib/utils";

export function TagPill({
  tag,
  onRemove,
}: {
  tag: Tag;
  onRemove?: () => void;
}) {
  const classes = STICKY_COLOR_CLASSES[tag.color];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium text-slate-700",
        classes.bg,
      )}
    >
      {tag.name}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="text-slate-400 hover:text-slate-700"
          aria-label={`移除 ${tag.name}`}
        >
          ×
        </button>
      )}
    </span>
  );
}
