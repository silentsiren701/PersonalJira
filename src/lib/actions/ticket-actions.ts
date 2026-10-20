"use server";

import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import { db } from "@/db";
import { boards, ticketTags, tickets } from "@/db/schema";
import { requireOwnedBoard } from "@/lib/authz";
import type { TicketStatus } from "@/lib/types";
import { createTicketSchema } from "@/lib/validation";
import { patchTicket, TicketOperationError } from "@/lib/ticket-service";

export type FormActionResult = { error: string } | undefined;

export async function createTicketAction(
  boardId: string,
  _prevState: FormActionResult,
  formData: FormData,
): Promise<FormActionResult> {
  const session = await auth();
  if (!session?.user) return { error: "Please sign in" };

  const board = await requireOwnedBoard(session.user.id, boardId).catch(
    () => null,
  );
  if (!board) return { error: "Board not found" };

  const rawTagIds = formData.getAll("tagIds").map(String).filter(Boolean);

  const parsed = createTicketSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    color: formData.get("color") || undefined,
    tagIds: rawTagIds.length ? rawTagIds : undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  // No db.transaction() here: the neon-http driver is stateless (one HTTPS
  // request per query) and doesn't support transactions. Number uniqueness
  // is guaranteed by the single atomic UPDATE...RETURNING below (plus the
  // unique constraint); a failure between steps at worst skips a number or
  // leaves a ticket without tags — both harmless for this tool.
  const [updated] = await db
    .update(boards)
    .set({ nextTicketNumber: sql`${boards.nextTicketNumber} + 1` })
    .where(eq(boards.id, boardId))
    .returning({ next: boards.nextTicketNumber });
  const number = updated.next - 1;

  const [positionRow] = await db
    .select({ maxPosition: sql<number>`coalesce(max(${tickets.position}), 0)` })
    .from(tickets)
    .where(and(eq(tickets.boardId, boardId), eq(tickets.status, "todo")));

  const [ticket] = await db
    .insert(tickets)
    .values({
      boardId,
      number,
      title: parsed.data.title,
      description: parsed.data.description ?? "",
      color: parsed.data.color ?? "yellow",
      position: (positionRow?.maxPosition ?? 0) + 1,
    })
    .returning();

  if (parsed.data.tagIds?.length) {
    await db
      .insert(ticketTags)
      .values(parsed.data.tagIds.map((tagId) => ({ ticketId: ticket.id, tagId })));
  }

  revalidatePath(`/b/${board.key}`);
}

export async function updateTicketAction(
  ticketId: string,
  boardId: string,
  _prevState: FormActionResult,
  formData: FormData,
): Promise<FormActionResult> {
  const session = await auth();
  if (!session?.user) return { error: "Please sign in" };

  const board = await requireOwnedBoard(session.user.id, boardId).catch(
    () => null,
  );
  if (!board) return { error: "Board not found" };

  const rawTagIds = formData.getAll("tagIds").map(String).filter(Boolean);

  try {
    await patchTicket({ ticketId, boardId }, {
      title: formData.get("title") || undefined,
      description: formData.get("description") ?? undefined,
      color: formData.get("color") || undefined,
      tagIds: rawTagIds,
    });
  } catch (error) {
    return { error: error instanceof TicketOperationError ? error.message : "Could not save ticket" };
  }

  revalidatePath(`/b/${board.key}`);
}

/**
 * Change a Ticket's status without an explicit drop position — used by the
 * detail panel's status dropdown (and mobile, where drag-and-drop is
 * awkward). Always appends to the end of the destination column.
 */
export async function setTicketStatusAction(
  ticketId: string,
  boardId: string,
  status: TicketStatus,
) {
  const session = await auth();
  if (!session?.user) throw new Error("Please sign in");

  const board = await requireOwnedBoard(session.user.id, boardId);

  await patchTicket({ ticketId, boardId }, { status });

  revalidatePath(`/b/${board.key}`);
}

/**
 * Drag-and-drop move: reposition a Ticket between two known neighbors
 * (either of which may be absent at a column boundary) and optionally change
 * its status in the same call (cross-column drag).
 */
export async function moveTicketAction(input: {
  ticketId: string;
  boardId: string;
  status: TicketStatus;
  beforeTicketId?: string | null;
  afterTicketId?: string | null;
}) {
  const session = await auth();
  if (!session?.user) throw new Error("Please sign in");

  const board = await requireOwnedBoard(session.user.id, input.boardId);

  const [current, before, after] = await Promise.all([
    db.query.tickets.findFirst({
      where: and(eq(tickets.id, input.ticketId), eq(tickets.boardId, input.boardId)),
    }),
    input.beforeTicketId
      ? db.query.tickets.findFirst({ where: eq(tickets.id, input.beforeTicketId) })
      : Promise.resolve(null),
    input.afterTicketId
      ? db.query.tickets.findFirst({ where: eq(tickets.id, input.afterTicketId) })
      : Promise.resolve(null),
  ]);
  if (!current) throw new Error("Ticket not found");

  let position: number;
  if (before && after) position = (before.position + after.position) / 2;
  else if (before) position = before.position + 1;
  else if (after) position = after.position / 2;
  else position = 1;

  const enteringClosed = input.status === "closed" && current.status !== "closed";
  const leavingClosed = input.status !== "closed" && current.status === "closed";

  await db
    .update(tickets)
    .set({
      status: input.status,
      position,
      closedAt: enteringClosed ? new Date() : leavingClosed ? null : current.closedAt,
      updatedAt: new Date(),
    })
    .where(eq(tickets.id, input.ticketId));

  revalidatePath(`/b/${board.key}`);
}

/**
 * Field-level patch used by blur autosave / immediate discrete controls.
 * Always bumps ticket.updatedAt.
 */
export async function patchTicketFieldsAction(
  ticketId: string,
  boardId: string,
  fields: {
    title?: string;
    description?: string;
    color?: string;
    tagIds?: string[];
    projectName?: string;
    repositoryUrl?: string;
  },
): Promise<FormActionResult> {
  const session = await auth();
  if (!session?.user) return { error: "Please sign in" };

  const board = await requireOwnedBoard(session.user.id, boardId).catch(
    () => null,
  );
  if (!board) return { error: "Board not found" };

  try {
    await patchTicket({ ticketId, boardId }, fields);
  } catch (error) {
    return { error: error instanceof TicketOperationError ? error.message : "Could not save ticket" };
  }

  revalidatePath(`/b/${board.key}`);
}

export async function deleteTicketAction(ticketId: string, boardId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Please sign in");

  const board = await requireOwnedBoard(session.user.id, boardId);

  await db
    .delete(tickets)
    .where(and(eq(tickets.id, ticketId), eq(tickets.boardId, boardId)));

  revalidatePath(`/b/${board.key}`);
}
