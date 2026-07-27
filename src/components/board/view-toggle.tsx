import Link from "next/link";

import { cn } from "@/lib/utils";

export function ViewToggle({
  boardKey,
  view,
}: {
  boardKey: string;
  view: "board" | "list";
}) {
  return (
    <div className="inline-flex rounded-md border border-slate-300 bg-white p-0.5 text-sm">
      <Link
        href={`/b/${boardKey}`}
        className={cn(
          "rounded px-3 py-1",
          view === "board"
            ? "bg-slate-900 text-white"
            : "text-slate-600 hover:bg-slate-50",
        )}
      >
        Board
      </Link>
      <Link
        href={`/b/${boardKey}?view=list`}
        className={cn(
          "rounded px-3 py-1",
          view === "list"
            ? "bg-slate-900 text-white"
            : "text-slate-600 hover:bg-slate-50",
        )}
      >
        List
      </Link>
    </div>
  );
}
