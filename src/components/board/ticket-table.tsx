import Link from "next/link";

import { TagPill } from "@/components/board/tag-pill";
import {
  STICKY_COLOR_CLASSES,
  TICKET_STATUSES,
  type TicketWithTags,
} from "@/lib/types";
import { cn } from "@/lib/utils";

const STATUS_LABELS = Object.fromEntries(
  TICKET_STATUSES.map((s) => [s.value, s.label]),
);

export function TicketTable({
  tickets,
  boardKey,
  detailHrefFor,
}: {
  tickets: TicketWithTags[];
  boardKey: string;
  detailHrefFor: (ticketId: string) => string;
}) {
  if (tickets.length === 0) {
    return (
      <p className="px-4 py-10 text-center text-sm text-slate-400">
        没有符合条件的 Ticket
      </p>
    );
  }

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-slate-200 text-left text-xs text-slate-500">
          <th className="px-4 py-2 font-medium">编号</th>
          <th className="px-4 py-2 font-medium">标题</th>
          <th className="px-4 py-2 font-medium">Tag</th>
          <th className="px-4 py-2 font-medium">状态</th>
        </tr>
      </thead>
      <tbody>
        {tickets.map((ticket) => {
          const classes = STICKY_COLOR_CLASSES[ticket.color];
          return (
            <tr
              key={ticket.id}
              className="border-b border-slate-100 hover:bg-slate-50"
            >
              <td className="whitespace-nowrap px-4 py-2">
                <Link
                  href={detailHrefFor(ticket.id)}
                  className="font-mono text-xs text-slate-500 hover:underline"
                >
                  {boardKey}-{ticket.number}
                </Link>
              </td>
              <td className="px-4 py-2">
                <Link
                  href={detailHrefFor(ticket.id)}
                  className="flex items-center gap-2 text-slate-900 hover:underline"
                >
                  <span className={cn("h-2.5 w-2.5 shrink-0 rounded-full", classes.bg)} />
                  {ticket.title}
                </Link>
              </td>
              <td className="px-4 py-2">
                <div className="flex flex-wrap gap-1">
                  {ticket.tags.map((tag) => (
                    <TagPill key={tag.id} tag={tag} />
                  ))}
                </div>
              </td>
              <td className="whitespace-nowrap px-4 py-2 text-slate-600">
                {STATUS_LABELS[ticket.status]}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
