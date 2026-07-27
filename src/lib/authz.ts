import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import { boards } from "@/db/schema";

/** Every mutation must go through this — Boards are strictly single-owner (see docs/adr/0003). */
export async function requireOwnedBoard(userId: string, boardId: string) {
  const board = await db.query.boards.findFirst({
    where: and(eq(boards.id, boardId), eq(boards.ownerId, userId)),
  });
  if (!board) {
    throw new Error("Board not found or you don't have permission");
  }
  return board;
}
