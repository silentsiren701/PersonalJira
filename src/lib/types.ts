import type { boards, tags, tickets } from "@/db/schema";

export type Board = typeof boards.$inferSelect;
export type Tag = typeof tags.$inferSelect;
export type Ticket = typeof tickets.$inferSelect;

export type TicketWithTags = Ticket & { tags: Tag[] };

export type TicketStatus = Ticket["status"];
export type StickyColor = Ticket["color"];

export const TICKET_STATUSES: { value: TicketStatus; label: string }[] = [
  { value: "not_started", label: "未开始" },
  { value: "in_progress", label: "进行中" },
  { value: "blocked", label: "Blocked" },
  { value: "closed", label: "关闭" },
];

export const STICKY_COLOR_CLASSES: Record<
  StickyColor,
  { bg: string; border: string; ring: string }
> = {
  yellow: {
    bg: "bg-yellow-100",
    border: "border-yellow-300",
    ring: "ring-yellow-400",
  },
  pink: { bg: "bg-pink-100", border: "border-pink-300", ring: "ring-pink-400" },
  blue: { bg: "bg-blue-100", border: "border-blue-300", ring: "ring-blue-400" },
  green: {
    bg: "bg-green-100",
    border: "border-green-300",
    ring: "ring-green-400",
  },
  orange: {
    bg: "bg-orange-100",
    border: "border-orange-300",
    ring: "ring-orange-400",
  },
  purple: {
    bg: "bg-purple-100",
    border: "border-purple-300",
    ring: "ring-purple-400",
  },
};
