"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import { db } from "@/db";
import { ticketUpdates, tickets } from "@/db/schema";
import { requireOwnedBoard } from "@/lib/authz";
import {
  createUpdateSchema,
  editUpdateSchema,
} from "@/lib/validation";

export type FormActionResult = { error: string } | undefined;

async function requireOwnedTicket(userId: string, ticketId: string) {
  const ticket = await db.query.tickets.findFirst({
    where: eq(tickets.id, ticketId),
  });
  if (!ticket) return null;
  const board = await requireOwnedBoard(userId, ticket.boardId).catch(
    () => null,
  );
  if (!board) return null;
  return { ticket, board };
}

export async function createUpdateAction(
  ticketId: string,
  boardId: string,
  _prevState: FormActionResult,
  formData: FormData,
): Promise<FormActionResult> {
  const session = await auth();
  if (!session?.user) return { error: "Please sign in" };

  const owned = await requireOwnedTicket(session.user.id, ticketId);
  if (!owned || owned.board.id !== boardId) {
    return { error: "Ticket not found" };
  }

  const parsed = createUpdateSchema.safeParse({
    body: formData.get("body"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const now = new Date();
  await db.insert(ticketUpdates).values({
    ticketId,
    body: parsed.data.body,
    createdAt: now,
    updatedAt: now,
  });
  await db
    .update(tickets)
    .set({ updatedAt: now })
    .where(eq(tickets.id, ticketId));

  revalidatePath(`/b/${owned.board.key}`);
}

export async function editUpdateAction(
  updateId: string,
  ticketId: string,
  boardId: string,
  _prevState: FormActionResult,
  formData: FormData,
): Promise<FormActionResult> {
  const session = await auth();
  if (!session?.user) return { error: "Please sign in" };

  const owned = await requireOwnedTicket(session.user.id, ticketId);
  if (!owned || owned.board.id !== boardId) {
    return { error: "Ticket not found" };
  }

  const parsed = editUpdateSchema.safeParse({
    body: formData.get("body"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const existing = await db.query.ticketUpdates.findFirst({
    where: and(
      eq(ticketUpdates.id, updateId),
      eq(ticketUpdates.ticketId, ticketId),
    ),
  });
  if (!existing) return { error: "Update not found" };

  const now = new Date();
  await db
    .update(ticketUpdates)
    .set({ body: parsed.data.body, updatedAt: now })
    .where(eq(ticketUpdates.id, updateId));
  await db
    .update(tickets)
    .set({ updatedAt: now })
    .where(eq(tickets.id, ticketId));

  revalidatePath(`/b/${owned.board.key}`);
}

export async function deleteUpdateAction(
  updateId: string,
  ticketId: string,
  boardId: string,
) {
  const session = await auth();
  if (!session?.user) throw new Error("Please sign in");

  const owned = await requireOwnedTicket(session.user.id, ticketId);
  if (!owned || owned.board.id !== boardId) {
    throw new Error("Ticket not found");
  }

  await db
    .delete(ticketUpdates)
    .where(
      and(
        eq(ticketUpdates.id, updateId),
        eq(ticketUpdates.ticketId, ticketId),
      ),
    );
  await db
    .update(tickets)
    .set({ updatedAt: new Date() })
    .where(eq(tickets.id, ticketId));

  revalidatePath(`/b/${owned.board.key}`);
}
