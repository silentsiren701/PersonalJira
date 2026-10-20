"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import { db } from "@/db";
import { ticketUpdates, tickets } from "@/db/schema";
import { requireOwnedBoard } from "@/lib/authz";
import { addTicketUpdate, editTicketUpdate, TicketOperationError } from "@/lib/ticket-service";

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

  const body = formData.get("body");
  if (typeof body !== "string") return { error: "Invalid update" };
  try {
    await addTicketUpdate({ ticketId, boardId }, { body, source: "user" });
  } catch (error) {
    return { error: error instanceof TicketOperationError ? error.message : "Could not save update" };
  }

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

  try {
    await editTicketUpdate({ ticketId, boardId }, updateId, {
      body: formData.get("body"),
      details: formData.get("details") ?? undefined,
    });
  } catch (error) {
    return { error: error instanceof TicketOperationError ? error.message : "Could not save update" };
  }

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
