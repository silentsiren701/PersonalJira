"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import { db } from "@/db";
import { boards } from "@/db/schema";
import { requireOwnedBoard } from "@/lib/authz";
import { createBoardSchema, updateBoardSchema } from "@/lib/validation";

export type FormActionResult = { error: string } | undefined;

export async function createBoardAction(
  _prevState: FormActionResult,
  formData: FormData,
): Promise<FormActionResult> {
  const session = await auth();
  if (!session?.user) return { error: "Please sign in" };

  const parsed = createBoardSchema.safeParse({
    name: formData.get("name"),
    key: formData.get("key"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const existing = await db.query.boards.findFirst({
    where: and(
      eq(boards.ownerId, session.user.id),
      eq(boards.key, parsed.data.key),
    ),
  });
  if (existing) {
    return { error: `Key "${parsed.data.key}" is already in use` };
  }

  await db.insert(boards).values({
    ownerId: session.user.id,
    name: parsed.data.name,
    key: parsed.data.key,
  });

  revalidatePath("/boards");
}

export async function updateBoardAction(
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

  const parsed = updateBoardSchema.safeParse({
    name: formData.get("name"),
    key: formData.get("key"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  if (parsed.data.key !== board.key) {
    const keyTaken = await db.query.boards.findFirst({
      where: and(
        eq(boards.ownerId, session.user.id),
        eq(boards.key, parsed.data.key),
      ),
    });
    if (keyTaken) return { error: `Key "${parsed.data.key}" is already in use` };
  }

  await db
    .update(boards)
    .set({ name: parsed.data.name, key: parsed.data.key, updatedAt: new Date() })
    .where(eq(boards.id, boardId));

  revalidatePath("/boards");
  revalidatePath(`/b/${board.key}`);
  if (parsed.data.key !== board.key) {
    revalidatePath(`/b/${parsed.data.key}`);
  }
}
