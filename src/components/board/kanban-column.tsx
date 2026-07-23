"use client";

import type { ReactNode } from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";

import { TicketCard } from "@/components/board/ticket-card";
import type { TicketStatus, TicketWithTags } from "@/lib/types";
import { cn } from "@/lib/utils";

export function KanbanColumn({
  status,
  label,
  tickets,
  boardKey,
  footer,
}: {
  status: TicketStatus;
  label: string;
  tickets: TicketWithTags[];
  boardKey: string;
  footer?: ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
    data: { status },
  });

  return (
    <div className="flex w-72 shrink-0 flex-col rounded-lg bg-slate-100/70">
      <div className="flex items-center justify-between px-3 py-2">
        <h3 className="text-sm font-semibold text-slate-700">{label}</h3>
        <span className="text-xs text-slate-400">{tickets.length}</span>
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          "min-h-[80px] flex-1 space-y-2 overflow-y-auto px-2 pb-2",
          isOver && "bg-slate-200/60",
        )}
      >
        <SortableContext
          items={tickets.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {tickets.map((ticket) => (
            <TicketCard key={ticket.id} ticket={ticket} boardKey={boardKey} />
          ))}
        </SortableContext>
      </div>
      {footer && <div className="px-2 pb-2">{footer}</div>}
    </div>
  );
}
