import { auth } from "@/auth";
import { BoardCard } from "@/components/boards/board-card";
import { CreateBoardForm } from "@/components/boards/create-board-form";
import { getBoardsForUser } from "@/lib/data";

export default async function BoardsPage() {
  const session = await auth();
  const boards = await getBoardsForUser(session!.user.id);

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-1 text-lg font-semibold text-slate-900">My Boards</h1>
      <p className="mb-6 text-sm text-slate-500">
        Switch by context (personal, work, …). Each Board has its own Tags and Ticket numbers.
      </p>

      {boards.length > 0 && (
        <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {boards.map((board) => (
            <BoardCard key={board.id} board={board} />
          ))}
        </div>
      )}

      <CreateBoardForm />
    </main>
  );
}
