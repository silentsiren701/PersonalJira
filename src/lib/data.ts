import { and, asc, desc, eq, gte, ilike, inArray, or, sql } from "drizzle-orm";

import { db } from "@/db";
import { boards, tags, ticketTags, tickets } from "@/db/schema";
import type { TicketWithTags } from "@/lib/types";
import { getTicketDto } from "@/lib/ticket-service";
import { ticketStatuses } from "@/lib/validation";

export function sevenDaysAgo(): Date {
  return new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
}

export async function getBoardsForUser(userId: string) {
  return db.query.boards.findMany({
    where: eq(boards.ownerId, userId),
    orderBy: [asc(boards.createdAt)],
  });
}

export async function getOwnedBoardByKey(userId: string, key: string) {
  const board = await db.query.boards.findFirst({
    where: and(eq(boards.ownerId, userId), eq(boards.key, key.toUpperCase())),
  });
  return board ?? null;
}

export async function getTagsForBoard(boardId: string) {
  return db.query.tags.findMany({
    where: eq(tags.boardId, boardId),
    orderBy: [asc(tags.createdAt)],
  });
}

function withTags<T extends { ticketTags: { tag: unknown }[] }>(
  row: T,
): Omit<T, "ticketTags"> & { tags: unknown[] } {
  const { ticketTags: rowTicketTags, ...rest } = row;
  return { ...rest, tags: rowTicketTags.map((tt) => tt.tag) };
}

/**
 * Tickets for the Kanban view: everything except 'closed' tickets older than
 * 7 days (see docs' "closed within 7 days" decision). Grouping by status and
 * ordering by position happens on the caller side.
 */
export async function getKanbanTickets(
  boardId: string,
): Promise<TicketWithTags[]> {
  const rows = await db.query.tickets.findMany({
    where: and(
      eq(tickets.boardId, boardId),
      or(
        sql`${tickets.status} <> 'closed'`,
        gte(tickets.closedAt, sevenDaysAgo()),
      ),
    ),
    with: { ticketTags: { with: { tag: true } } },
    orderBy: [asc(tickets.position)],
  });

  return rows.map((row) => withTags(row)) as TicketWithTags[];
}

export interface ListFilters {
  status?: string;
  tagIds?: string[];
  search?: string;
  page?: number;
  pageSize?: number;
}

export async function getTicketsForList(boardId: string, filters: ListFilters) {
  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? 20;

  const conditions = [eq(tickets.boardId, boardId)];

  // Guard against a crafted/invalid `status` query param — an unrecognized
  // value is ignored (treated as "no filter") rather than passed to
  // Postgres, which would reject it since the column is a strict enum.
  if (filters.status && (ticketStatuses as readonly string[]).includes(filters.status)) {
    conditions.push(
      eq(tickets.status, filters.status as (typeof ticketStatuses)[number]),
    );
  }
  if (filters.search) {
    conditions.push(ilike(tickets.title, `%${filters.search}%`));
  }

  let ticketIdsMatchingTags: string[] | null = null;
  if (filters.tagIds && filters.tagIds.length > 0) {
    const rows = await db
      .select({ ticketId: ticketTags.ticketId })
      .from(ticketTags)
      .where(inArray(ticketTags.tagId, filters.tagIds));
    ticketIdsMatchingTags = rows.map((r) => r.ticketId);
    if (ticketIdsMatchingTags.length === 0) {
      return { tickets: [] as TicketWithTags[], total: 0, page, pageSize };
    }
    conditions.push(inArray(tickets.id, ticketIdsMatchingTags));
  }

  const where = and(...conditions);

  const [rows, [{ count }]] = await Promise.all([
    db.query.tickets.findMany({
      where,
      with: { ticketTags: { with: { tag: true } } },
      orderBy: [desc(tickets.createdAt)],
      limit: pageSize,
      offset: (page - 1) * pageSize,
    }),
    db.select({ count: sql<number>`count(*)::int` }).from(tickets).where(where),
  ]);

  return {
    tickets: rows.map((row) => withTags(row)) as TicketWithTags[],
    total: count,
    page,
    pageSize,
  };
}

export async function getTicketWithTags(ticketId: string) {
  return getTicketDto(ticketId);
}
