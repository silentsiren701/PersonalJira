"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, Plus } from "lucide-react";

import type { Board } from "@/lib/types";
import { cn } from "@/lib/utils";

export function BoardSwitcher({ boards }: { boards: Board[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const currentBoardKey = pathname.match(/^\/b\/([^/]+)/)?.[1];

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const current = boards.find((b) => b.key === currentBoardKey);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-900 hover:bg-slate-50"
      >
        {current ? `${current.name} (${current.key})` : "Select Board"}
        <ChevronDown className="h-4 w-4 text-slate-500" />
      </button>

      {open && (
        <div className="absolute left-0 z-20 mt-1 w-64 rounded-md border border-slate-200 bg-white py-1 shadow-lg">
          {boards.map((board) => (
            <Link
              key={board.id}
              href={`/b/${board.key}`}
              onClick={() => setOpen(false)}
              className={cn(
                "block px-3 py-2 text-sm hover:bg-slate-50",
                board.key === currentBoardKey
                  ? "font-medium text-slate-900"
                  : "text-slate-600",
              )}
            >
              {board.name}{" "}
              <span className="text-xs text-slate-400">{board.key}</span>
            </Link>
          ))}
          <div className="my-1 border-t border-slate-100" />
          <Link
            href="/boards"
            onClick={() => setOpen(false)}
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
          >
            <Plus className="h-3.5 w-3.5" />
            Manage / create Board
          </Link>
        </div>
      )}
    </div>
  );
}
