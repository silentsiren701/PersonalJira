"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { auth } from "@/auth";
import { db } from "@/db";
import { boards, ticketAgentConnections, tickets } from "@/db/schema";
import { generateAgentToken } from "@/lib/agent/credentials";

async function ownedTicket(ticketId: string) {
  const session = await auth();
  if (!session?.user || !z.string().uuid().safeParse(ticketId).success) return null;
  const [row] = await db.select({ boardKey: boards.key }).from(tickets)
    .innerJoin(boards, eq(boards.id, tickets.boardId))
    .where(and(eq(tickets.id, ticketId), eq(boards.ownerId, session.user.id))).limit(1);
  return row ?? null;
}

export async function createAgentConnectionAction(ticketId: string) {
  const ticket = await ownedTicket(ticketId);
  if (!ticket) return { error: "Ticket not found or you are not signed in" };
  const { token, tokenHash } = generateAgentToken();
  await db.insert(ticketAgentConnections).values({ ticketId, tokenHash })
    .onConflictDoUpdate({ target: ticketAgentConnections.ticketId, set: { tokenHash, createdAt: new Date() } });
  revalidatePath(`/b/${ticket.boardKey}`);
  return { token };
}

export async function revokeAgentConnectionAction(ticketId: string) {
  const ticket = await ownedTicket(ticketId);
  if (!ticket) return { error: "Ticket not found or you are not signed in" };
  await db.delete(ticketAgentConnections).where(eq(ticketAgentConnections.ticketId, ticketId));
  revalidatePath(`/b/${ticket.boardKey}`);
  return { success: true };
}
