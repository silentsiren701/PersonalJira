"use client";

import { useState, useTransition } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";

import { CreateTicketButton } from "@/components/board/create-ticket-button";
import { KanbanColumn } from "@/components/board/kanban-column";
import { TicketCardPreview } from "@/components/board/ticket-card";
import { dropIsAfterCard, kanbanCollisionDetection } from "@/lib/kanban-drag";
import { moveTicketAction } from "@/lib/actions/ticket-actions";
import {
  TICKET_STATUSES,
  type Board,
  type Tag,
  type TicketStatus,
  type TicketWithTags,
} from "@/lib/types";

type Columns = Record<TicketStatus, TicketWithTags[]>;

function emptyColumns(): Columns {
  return { todo: [], in_progress: [], blocked: [], closed: [] };
}

/** Map legacy / unexpected status values so Kanban never indexes a missing column. */
function normalizeStatus(status: string): TicketStatus {
  if (status === "not_started") return "todo";
  if (
    status === "todo" ||
    status === "in_progress" ||
    status === "blocked" ||
    status === "closed"
  ) {
    return status;
  }
  return "todo";
}

function groupByStatus(ticketList: TicketWithTags[]): Columns {
  const columns = emptyColumns();
  for (const ticket of ticketList) {
    const status = normalizeStatus(ticket.status);
    columns[status].push(
      status === ticket.status ? ticket : { ...ticket, status },
    );
  }
  (Object.keys(columns) as TicketStatus[]).forEach((status) => {
    columns[status].sort((a, b) => a.position - b.position);
  });
  return columns;
}

export function KanbanBoard({
  board,
  boardTags,
  initialTickets,
}: {
  board: Board;
  boardTags: Tag[];
  initialTickets: TicketWithTags[];
}) {
  const [columns, setColumns] = useState<Columns>(() =>
    groupByStatus(initialTickets),
  );
  const [activeTicket, setActiveTicket] = useState<TicketWithTags | null>(
    null,
  );
  const [, startTransition] = useTransition();

  // Re-derive columns when the server gives us a new `initialTickets` (e.g.
  // after revalidation) — adjusting state during render instead of in an
  // effect, per https://react.dev/learn/you-might-not-need-an-effect.
  const [prevInitialTickets, setPrevInitialTickets] = useState(initialTickets);
  if (initialTickets !== prevInitialTickets) {
    setPrevInitialTickets(initialTickets);
    setColumns(groupByStatus(initialTickets));
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  function findColumnOf(ticketId: string): TicketStatus | null {
    for (const status of Object.keys(columns) as TicketStatus[]) {
      if (columns[status].some((t) => t.id === ticketId)) return status;
    }
    return null;
  }

  function handleDragStart(event: DragStartEvent) {
    const id = String(event.active.id);
    const status = findColumnOf(id);
    if (!status) return;
    setActiveTicket(columns[status].find((t) => t.id === id) ?? null);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveTicket(null);
    const { active, over } = event;
    if (!over) return;

    const activeId = String(active.id);
    const fromStatus = findColumnOf(activeId);
    if (!fromStatus) return;

    const overId = String(over.id);
    const overIsColumn = TICKET_STATUSES.some((s) => s.value === overId);
    const toStatus = overIsColumn
      ? (overId as TicketStatus)
      : findColumnOf(overId);
    if (!toStatus) return;
    if (fromStatus === toStatus && activeId === overId) return;

    const next: Columns = {
      todo: [...columns.todo],
      in_progress: [...columns.in_progress],
      blocked: [...columns.blocked],
      closed: [...columns.closed],
    };
    const fromList = next[fromStatus];
    const movingIndex = fromList.findIndex((t) => t.id === activeId);
    if (movingIndex === -1) return;
    const [moving] = fromList.splice(movingIndex, 1);
    const movedTicket = { ...moving, status: toStatus };

    const toList = next[toStatus];
    let insertIndex = toList.length;
    if (!overIsColumn) {
      const overIndex = toList.findIndex((t) => t.id === overId);
      if (overIndex !== -1) insertIndex = overIndex + (dropIsAfterCard(event) ? 1 : 0);
    }
    toList.splice(insertIndex, 0, movedTicket);

    const beforeTicketId = toList[insertIndex - 1]?.id ?? null;
    const afterTicketId = toList[insertIndex + 1]?.id ?? null;

    setColumns(next);
    startTransition(async () => {
      await moveTicketAction({
        ticketId: activeId,
        boardId: board.id,
        status: toStatus,
        beforeTicketId,
        afterTicketId,
      });
    });
  }

  return (
    <DndContext
      id="kanban-board"
      sensors={sensors}
      collisionDetection={kanbanCollisionDetection}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveTicket(null)}
    >
      <div className="flex gap-4 overflow-x-auto p-4 md:p-6 lg:p-8 justify-start">
        {TICKET_STATUSES.map(({ value, label }) => (
          <KanbanColumn
            key={value}
            status={value}
            label={
              value === "closed" ? `${label} (last 7 days)` : label
            }
            tickets={columns[value]}
            boardKey={board.key}
            footer={
              value === "todo" ? (
                <CreateTicketButton boardId={board.id} boardTags={boardTags} />
              ) : undefined
            }
          />
        ))}
      </div>
      <DragOverlay>
        {activeTicket ? (
          <TicketCardPreview ticket={activeTicket} boardKey={board.key} />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
