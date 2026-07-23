"use client";

import { useTransition } from "react";

import { setTicketStatusAction } from "@/lib/actions/ticket-actions";
import { TICKET_STATUSES, type TicketStatus } from "@/lib/types";

export function StatusSelect({
  ticketId,
  boardId,
  status,
}: {
  ticketId: string;
  boardId: string;
  status: TicketStatus;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <select
      value={status}
      disabled={isPending}
      onChange={(e) => {
        const next = e.target.value as TicketStatus;
        startTransition(async () => {
          await setTicketStatusAction(ticketId, boardId, next);
        });
      }}
      className="rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
    >
      {TICKET_STATUSES.map((s) => (
        <option key={s.value} value={s.value}>
          {s.label}
        </option>
      ))}
    </select>
  );
}
