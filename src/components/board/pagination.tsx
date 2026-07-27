import Link from "next/link";

import { cn } from "@/lib/utils";

export function Pagination({
  page,
  pageSize,
  total,
  buildHref,
}: {
  page: number;
  pageSize: number;
  total: number;
  buildHref: (page: number) => string;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (totalPages <= 1 && total === 0) return null;

  return (
    <div className="flex items-center justify-between px-4 py-3 text-sm text-slate-500">
      <span>{total} total</span>
      <div className="flex items-center gap-3">
        <Link
          href={buildHref(Math.max(1, page - 1))}
          className={cn(
            page <= 1
              ? "pointer-events-none text-slate-300"
              : "text-slate-700 hover:underline",
          )}
        >
          Previous
        </Link>
        <span>
          {page} / {totalPages}
        </span>
        <Link
          href={buildHref(Math.min(totalPages, page + 1))}
          className={cn(
            page >= totalPages
              ? "pointer-events-none text-slate-300"
              : "text-slate-700 hover:underline",
          )}
        >
          Next
        </Link>
      </div>
    </div>
  );
}
