"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import { db } from "@/db";
import { tags } from "@/db/schema";
import { requireOwnedBoard } from "@/lib/authz";
import { createTagSchema, stickyColors } from "@/lib/validation";

export type FormActionResult = { error: string } | undefined;

export async function createTagAction(
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

  const parsed = createTagSchema.safeParse({
    name: formData.get("name"),
    color: formData.get("color") || stickyColors[0],
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const existing = await db.query.tags.findFirst({
    where: and(eq(tags.boardId, boardId), eq(tags.name, parsed.data.name)),
  });
  if (existing) return { error: "This Tag already exists" };

  await db.insert(tags).values({
    boardId,
    name: parsed.data.name,
    color: parsed.data.color,
  });

  revalidatePath(`/b/${board.key}`);
}

export async function deleteTagAction(boardId: string, tagId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Please sign in");

  const board = await requireOwnedBoard(session.user.id, boardId);

  await db
    .delete(tags)
    .where(and(eq(tags.id, tagId), eq(tags.boardId, boardId)));

  revalidatePath(`/b/${board.key}`);
}
