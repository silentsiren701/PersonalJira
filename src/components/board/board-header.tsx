import { CreateTicketButton } from "@/components/board/create-ticket-button";
import { TagManager } from "@/components/board/tag-manager";
import { ViewToggle } from "@/components/board/view-toggle";
import type { Board, Tag } from "@/lib/types";

export function BoardHeader({
  board,
  tags,
  view,
}: {
  board: Board;
  tags: Tag[];
  view: "board" | "list";
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3">
      <div>
        <h1 className="text-base font-semibold text-slate-900">
          {board.name}
        </h1>
        <p className="font-mono text-xs text-slate-400">{board.key}</p>
      </div>
      <div className="flex items-center gap-2">
        <ViewToggle boardKey={board.key} view={view} />
        <TagManager boardId={board.id} tags={tags} />
        <CreateTicketButton
          boardId={board.id}
          boardTags={tags}
          variant="header"
        />
      </div>
    </div>
  );
}
