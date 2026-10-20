import type { boards, tags, tickets, ticketUpdates } from "@/db/schema";

export type Board = typeof boards.$inferSelect;
export type Tag = typeof tags.$inferSelect;
export type Ticket = typeof tickets.$inferSelect;
export type TicketUpdate = typeof ticketUpdates.$inferSelect;

export type TicketWithTags = Ticket & { tags: Tag[] };
export type TicketWithTagsAndUpdates = TicketWithTags & {
  updates: TicketUpdate[];
  agentConnection: { createdAt: Date } | null;
};

export type TicketStatus = Ticket["status"];
export type StickyColor = Ticket["color"];

export const TICKET_STATUSES: { value: TicketStatus; label: string }[] = [
  { value: "todo", label: "To Do" },
  { value: "blocked", label: "Blocked" },
  { value: "in_progress", label: "In Progress" },
  { value: "closed", label: "Closed" },
];

export const STICKY_COLOR_CLASSES: Record<
  StickyColor,
  { bg: string; border: string; ring: string }
> = {
  yellow: {
    bg: "bg-yellow-50",
    border: "border-yellow-200",
    ring: "ring-yellow-400",
  },
  pink: { bg: "bg-pink-50", border: "border-pink-200", ring: "ring-pink-400" },
  blue: { bg: "bg-blue-50", border: "border-blue-200", ring: "ring-blue-400" },
  green: {
    bg: "bg-green-50",
    border: "border-green-200",
    ring: "ring-green-400",
  },
  orange: {
    bg: "bg-orange-50",
    border: "border-orange-200",
    ring: "ring-orange-400",
  },
  purple: {
    bg: "bg-purple-50",
    border: "border-purple-200",
    ring: "ring-purple-400",
  },
};

export function formatTicketUpdatedAt(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
