import { STICKY_COLOR_CLASSES, TICKET_STATUSES, type Tag } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * Plain GET form — filters live in the URL, no client JS required. Works
 * because the List view is fully server-rendered from `searchParams`.
 */
export function TicketFilters({
  boardKey,
  tags,
  currentStatus,
  currentTagIds,
  currentSearch,
}: {
  boardKey: string;
  tags: Tag[];
  currentStatus?: string;
  currentTagIds: string[];
  currentSearch?: string;
}) {
  const hasFilters =
    !!currentStatus || currentTagIds.length > 0 || !!currentSearch;

  return (
    <form
      method="get"
      action={`/b/${boardKey}`}
      className="flex flex-wrap items-end gap-4 border-b border-slate-100 bg-white px-4 py-3"
    >
      <input type="hidden" name="view" value="list" />
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-500">
          Search title
        </label>
        <input
          type="text"
          name="q"
          defaultValue={currentSearch}
          placeholder="Title contains…"
          className="rounded-md border border-slate-300 px-2.5 py-1.5 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-500">
          Status
        </label>
        <select
          name="status"
          defaultValue={currentStatus ?? ""}
          className="rounded-md border border-slate-300 px-2.5 py-1.5 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
        >
          <option value="">All</option>
          {TICKET_STATUSES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <span className="mb-1 block text-xs font-medium text-slate-500">
          Tag (match any)
        </span>
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => {
            const classes = STICKY_COLOR_CLASSES[tag.color];
            return (
              <label key={tag.id} className="cursor-pointer">
                <input
                  type="checkbox"
                  name="tags"
                  value={tag.id}
                  defaultChecked={currentTagIds.includes(tag.id)}
                  className="peer sr-only"
                />
                <span
                  className={cn(
                    "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium text-slate-600 opacity-60 ring-1 ring-slate-300 peer-checked:opacity-100 peer-checked:ring-2 peer-checked:ring-slate-500",
                    classes.bg,
                  )}
                >
                  {tag.name}
                </span>
              </label>
            );
          })}
          {tags.length === 0 && (
            <span className="text-sm text-slate-400">No Tags</span>
          )}
        </div>
      </div>
      <button
        type="submit"
        className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700"
      >
        Filter
      </button>
      {hasFilters && (
        <a
          href={`/b/${boardKey}?view=list`}
          className="text-sm text-slate-500 underline"
        >
          Clear filters
        </a>
      )}
    </form>
  );
}
