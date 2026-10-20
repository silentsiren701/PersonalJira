import { and, asc, eq, inArray, sql } from "drizzle-orm";

import { db } from "@/db";
import { tags, tickets, ticketTags, ticketUpdates } from "@/db/schema";
import { editUpdateSchema, updateTicketSchema } from "@/lib/validation";

export class TicketOperationError extends Error {}
export type TicketScope = { ticketId: string; boardId: string };

export async function getTicketDto(ticketId: string, boardId?: string) {
  const row = await db.query.tickets.findFirst({
    where: and(eq(tickets.id, ticketId), boardId ? eq(tickets.boardId, boardId) : undefined),
    with: {
      board: { columns: { key: true } },
      ticketTags: { with: { tag: true } },
      updates: { orderBy: [asc(ticketUpdates.createdAt), asc(ticketUpdates.id)] },
      agentConnection: { columns: { createdAt: true } },
    },
  });
  if (!row) return null;
  const { board, ticketTags: assignments, ...ticket } = row;
  return { ...ticket, displayId: `${board.key}-${ticket.number}`, tags: assignments.map(({ tag }) => tag) };
}

export type TicketDto = NonNullable<Awaited<ReturnType<typeof getTicketDto>>>;

export async function patchTicket(scope: TicketScope, changes: unknown) {
  const parsed = updateTicketSchema.strict().safeParse(changes);
  if (!parsed.success) throw new TicketOperationError(parsed.error.issues[0]?.message ?? "Invalid fields");
  if (!Object.values(parsed.data).some((value) => value !== undefined)) {
    throw new TicketOperationError("Supply at least one field to update");
  }
  const current = await db.query.tickets.findFirst({
    where: and(eq(tickets.id, scope.ticketId), eq(tickets.boardId, scope.boardId)),
  });
  if (!current) throw new TicketOperationError("Ticket not found");
  const { tagIds, ...fields } = parsed.data;
  const assignedIds = tagIds === undefined ? undefined : [...new Set(tagIds)];
  if (assignedIds?.length) {
    const allowed = await db.select({ id: tags.id }).from(tags).where(
      and(eq(tags.boardId, scope.boardId), inArray(tags.id, assignedIds)),
    );
    if (allowed.length !== assignedIds.length) throw new TicketOperationError("Tags must belong to this ticket's board");
  }
  const now = new Date();
  const statusFields: { position?: number; closedAt?: Date | null } = {};
  if (fields.status !== undefined && fields.status !== current.status) {
    const [last] = await db.select({ max: sql<number>`coalesce(max(${tickets.position}), 0)` })
      .from(tickets).where(and(eq(tickets.boardId, scope.boardId), eq(tickets.status, fields.status)));
    statusFields.position = (last?.max ?? 0) + 1;
    statusFields.closedAt = fields.status === "closed" ? now : null;
  }
  const [updated] = await db.update(tickets).set({ ...fields, ...statusFields, updatedAt: now })
    .where(and(eq(tickets.id, scope.ticketId), eq(tickets.boardId, scope.boardId))).returning({ id: tickets.id });
  if (!updated) throw new TicketOperationError("Ticket not found");
  if (assignedIds !== undefined) {
    await db.delete(ticketTags).where(eq(ticketTags.ticketId, scope.ticketId));
    if (assignedIds.length) {
      await db.insert(ticketTags).values(assignedIds.map((tagId) => ({ ticketId: scope.ticketId, tagId })));
    }
  }
}

export async function editTicketUpdate(scope: TicketScope, updateId: string, changes: unknown) {
  const parsed = editUpdateSchema.strict().safeParse(changes);
  if (!parsed.success) throw new TicketOperationError(parsed.error.issues[0]?.message ?? "Invalid update");
  const ticket = await db.query.tickets.findFirst({
    where: and(eq(tickets.id, scope.ticketId), eq(tickets.boardId, scope.boardId)), columns: { id: true },
  });
  if (!ticket) throw new TicketOperationError("Ticket not found");
  const now = new Date();
  const [updated] = await db.update(ticketUpdates).set({ ...parsed.data, updatedAt: now })
    .where(and(eq(ticketUpdates.id, updateId), eq(ticketUpdates.ticketId, scope.ticketId))).returning();
  if (!updated) throw new TicketOperationError("Update does not belong to this ticket");
  await db.update(tickets).set({ updatedAt: now })
    .where(and(eq(tickets.id, scope.ticketId), eq(tickets.boardId, scope.boardId)));
  return updated;
}

export async function addTicketUpdate(scope: TicketScope, input: {
  body: string; details?: string; source: "user" | "agent"; agentName?: string; requestId?: string;
}) {
  const parsed = editUpdateSchema.strict().safeParse({ body: input.body, details: input.details ?? "" });
  if (!parsed.success) throw new TicketOperationError(parsed.error.issues[0]?.message ?? "Invalid update");
  const agentName = input.source === "agent" ? input.agentName ?? "Agent" : null;
  const result = await db.execute<{ id: string }>(sql`
    WITH inserted AS (
      INSERT INTO ticket_updates (ticket_id, body, details, source, agent_name, request_id)
      SELECT id, ${parsed.data.body}, ${parsed.data.details}, ${input.source}, ${agentName}, ${input.requestId ?? null}::uuid
      FROM tickets WHERE id = ${scope.ticketId}::uuid AND board_id = ${scope.boardId}::uuid
      ON CONFLICT (ticket_id, request_id) DO NOTHING
      RETURNING id
    ), touched AS (
      UPDATE tickets SET updated_at = now()
      WHERE id = ${scope.ticketId}::uuid AND EXISTS (SELECT 1 FROM inserted)
      RETURNING id
    )
    SELECT id FROM inserted
  `);
  if (result.rows[0]) return { id: result.rows[0].id, duplicate: false };
  if (input.requestId) {
    const existing = await db.query.ticketUpdates.findFirst({
      where: and(eq(ticketUpdates.ticketId, scope.ticketId), eq(ticketUpdates.requestId, input.requestId)),
    });
    if (existing) {
      if (existing.body === parsed.data.body && existing.details === parsed.data.details
        && existing.source === input.source && existing.agentName === agentName) {
        return { id: existing.id, duplicate: true };
      }
      throw new TicketOperationError("This requestId was used with different content; use a new UUID for a new update");
    }
  }
  throw new TicketOperationError("Ticket not found");
}
