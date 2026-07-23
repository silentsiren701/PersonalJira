import { notFound, redirect } from "next/navigation";

import { auth } from "@/auth";
import { BoardHeader } from "@/components/board/board-header";
import { KanbanBoard } from "@/components/board/kanban-board";
import { Pagination } from "@/components/board/pagination";
import { TicketDetailModal } from "@/components/board/ticket-detail-modal";
import { TicketFilters } from "@/components/board/ticket-filters";
import { TicketTable } from "@/components/board/ticket-table";
import {
  getKanbanTickets,
  getOwnedBoardByKey,
  getTagsForBoard,
  getTicketWithTags,
  getTicketsForList,
} from "@/lib/data";

type SearchParams = Record<string, string | string[] | undefined>;

export default async function BoardPage({
  params,
  searchParams,
}: {
  params: Promise<{ key: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { key } = await params;
  const sp = await searchParams;

  const board = await getOwnedBoardByKey(session.user.id, key);
  if (!board) notFound();

  const tags = await getTagsForBoard(board.id);
  const view: "board" | "list" = sp.view === "list" ? "list" : "board";

  const ticketParam = typeof sp.ticket === "string" ? sp.ticket : undefined;
  const rawSelected = ticketParam ? await getTicketWithTags(ticketParam) : null;
  const selectedTicket =
    rawSelected && rawSelected.boardId === board.id ? rawSelected : null;

  const currentStatus =
    typeof sp.status === "string" && sp.status ? sp.status : undefined;
  const currentSearch = typeof sp.q === "string" && sp.q ? sp.q : undefined;
  const currentTagIds = Array.isArray(sp.tags)
    ? sp.tags
    : sp.tags
      ? [sp.tags]
      : [];
  const currentPage =
    typeof sp.page === "string" ? Math.max(1, parseInt(sp.page, 10) || 1) : 1;

  // Filters shared by the "close modal" link and every detail-row link.
  const baseParams = new URLSearchParams();
  if (view === "list") {
    baseParams.set("view", "list");
    if (currentSearch) baseParams.set("q", currentSearch);
    if (currentStatus) baseParams.set("status", currentStatus);
    if (currentPage > 1) baseParams.set("page", String(currentPage));
    currentTagIds.forEach((t) => baseParams.append("tags", t));
  }
  const closeHref = `/b/${board.key}${baseParams.size ? `?${baseParams}` : ""}`;
  const detailHrefFor = (ticketId: string) => {
    const p = new URLSearchParams(baseParams);
    p.set("ticket", ticketId);
    return `/b/${board.key}?${p}`;
  };
  const pageHref = (targetPage: number) => {
    const p = new URLSearchParams(baseParams);
    if (targetPage > 1) p.set("page", String(targetPage));
    else p.delete("page");
    return `/b/${board.key}?${p}`;
  };

  const kanbanTickets =
    view === "board" ? await getKanbanTickets(board.id) : [];
  const listResult =
    view === "list"
      ? await getTicketsForList(board.id, {
          status: currentStatus,
          tagIds: currentTagIds.length ? currentTagIds : undefined,
          search: currentSearch,
          page: currentPage,
        })
      : null;

  return (
    <div>
      <BoardHeader board={board} tags={tags} view={view} />

      {view === "board" ? (
        <KanbanBoard board={board} boardTags={tags} initialTickets={kanbanTickets} />
      ) : (
        <>
          <TicketFilters
            boardKey={board.key}
            tags={tags}
            currentStatus={currentStatus}
            currentTagIds={currentTagIds}
            currentSearch={currentSearch}
          />
          <TicketTable
            tickets={listResult!.tickets}
            boardKey={board.key}
            detailHrefFor={detailHrefFor}
          />
          <Pagination
            page={listResult!.page}
            pageSize={listResult!.pageSize}
            total={listResult!.total}
            buildHref={pageHref}
          />
        </>
      )}

      <TicketDetailModal
        ticket={selectedTicket}
        boardId={board.id}
        boardKey={board.key}
        boardTags={tags}
        closeHref={closeHref}
      />
    </div>
  );
}
