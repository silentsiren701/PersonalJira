"use client";

import Link from "next/link";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";

import { cn } from "@/lib/utils";
import { STICKY_COLOR_CLASSES, type TicketWithTags } from "@/lib/types";
import { TagPill } from "@/components/board/tag-pill";

const cardClassName = "group relative rounded-lg border p-3 shadow-sm transition-shadow hover:shadow-md";

function TicketCardDetails({ ticket, boardKey }: { ticket: TicketWithTags; boardKey: string }) {
  return <>
    <div className="mb-1 font-mono text-[11px] font-medium text-slate-500">{boardKey}-{ticket.number}</div>
    <div className="mb-1.5 text-sm font-medium text-slate-900">{ticket.title}</div>
    {ticket.tags.length > 0 && <div className="flex flex-wrap gap-1">
      {ticket.tags.map((tag) => <TagPill key={tag.id} tag={tag} />)}
    </div>}
  </>;
}

/** The overlay is presentation only: it must not register the same sortable ID again. */
export function TicketCardPreview({ ticket, boardKey }: { ticket: TicketWithTags; boardKey: string }) {
  const classes = STICKY_COLOR_CLASSES[ticket.color];
  return <div className={cn(cardClassName, classes.bg, classes.border, "pointer-events-none")}>
    <GripVertical aria-hidden="true" className="absolute right-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
    <div className="pr-5"><TicketCardDetails ticket={ticket} boardKey={boardKey} /></div>
  </div>;
}

export function TicketCard({
  ticket,
  boardKey,
}: {
  ticket: TicketWithTags;
  boardKey: string;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: ticket.id, data: { kind: "ticket", status: ticket.status } });

  const classes = STICKY_COLOR_CLASSES[ticket.color];

  return (
    <div
      ref={setNodeRef}
      data-ticket-id={ticket.id}
      style={{
        transform: CSS.Translate.toString(transform),
        transition,
      }}
      className={cn(
        cardClassName,
        classes.bg,
        classes.border,
        isDragging && "opacity-50 shadow-lg",
      )}
    >
      <button
        type="button"
        aria-label="Drag to reorder"
        className="absolute right-1.5 top-1.5 cursor-grab touch-none rounded p-1 text-slate-400 opacity-0 hover:bg-black/5 group-hover:opacity-100 active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-3.5 w-3.5" />
      </button>

      <Link href={`/b/${boardKey}?ticket=${ticket.id}`} className="block pr-5">
        <TicketCardDetails ticket={ticket} boardKey={boardKey} />
      </Link>
    </div>
  );
}
