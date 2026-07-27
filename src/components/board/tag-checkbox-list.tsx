import { STICKY_COLOR_CLASSES, type Tag } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * Renders board Tags as toggle pills backed by plain (hidden) checkboxes, so
 * this works inside a native <form action={serverAction}> without any
 * client-side state — selection is submitted as repeated `tagIds` fields.
 */
export function TagCheckboxList({
  tags,
  selectedTagIds = [],
}: {
  tags: Tag[];
  selectedTagIds?: string[];
}) {
  if (tags.length === 0) {
    return (
      <p className="text-sm text-slate-400">No tags on this Board yet</p>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((tag) => {
        const classes = STICKY_COLOR_CLASSES[tag.color];
        return (
          <label key={tag.id} className="cursor-pointer">
            <input
              type="checkbox"
              name="tagIds"
              value={tag.id}
              defaultChecked={selectedTagIds.includes(tag.id)}
              className="peer sr-only"
            />
            <span
              className={cn(
                "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium text-slate-600 opacity-60 ring-1 ring-slate-300 transition peer-checked:opacity-100 peer-checked:ring-2 peer-checked:ring-slate-500",
                classes.bg,
              )}
            >
              {tag.name}
            </span>
          </label>
        );
      })}
    </div>
  );
}
