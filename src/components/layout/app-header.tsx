import Link from "next/link";
import { LogOut } from "lucide-react";

import { logoutAction } from "@/lib/actions/auth-actions";
import { BoardSwitcher } from "@/components/boards/board-switcher";
import type { Board } from "@/lib/types";

export function AppHeader({ boards }: { boards: Board[] }) {
  return (
    <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white/95 px-4 py-2.5 backdrop-blur">
      <div className="flex items-center gap-3">
        <Link href="/boards" className="text-sm font-semibold text-slate-900">
          Ticket Record
        </Link>
        <BoardSwitcher boards={boards} />
      </div>
      <form action={logoutAction}>
        <button
          type="submit"
          className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm text-slate-500 hover:bg-slate-100 hover:text-slate-900"
        >
          <LogOut className="h-4 w-4" />
          登出
        </button>
      </form>
    </header>
  );
}
