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
    <div className="flex w-72 shrink-0 flex-col rounded-xl bg-slate-200/50">
      <div className="flex items-center justify-between px-3 py-3">
        <h3 className="text-sm font-semibold text-slate-700">{label}</h3>
        <span className="text-xs font-medium text-slate-400">{tickets.length}</span>
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          "min-h-[100px] flex-1 space-y-3 overflow-y-auto px-3 pb-3",
          isOver && "bg-slate-200",
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
