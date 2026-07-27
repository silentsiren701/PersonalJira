"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateBoardAction } from "@/lib/actions/board-actions";
import type { Board } from "@/lib/types";

export function BoardCard({ board }: { board: Board }) {
  const [editing, setEditing] = useState(false);
  const action = updateBoardAction.bind(null, board.id);
  const [state, formAction, isPending] = useActionState(action, undefined);
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !isPending && !state?.error) {
      setEditing(false);
    }
    wasPending.current = isPending;
  }, [isPending, state]);

  if (editing) {
    return (
      <form
        action={formAction}
        className="space-y-3 rounded-lg border border-slate-200 bg-white p-4"
      >
        <div>
          <Label htmlFor={`name-${board.id}`}>Name</Label>
          <Input
            id={`name-${board.id}`}
            name="name"
            defaultValue={board.name}
            required
          />
        </div>
        <div className="w-28">
          <Label htmlFor={`key-${board.id}`}>Key</Label>
          <Input
            id={`key-${board.id}`}
            name="key"
            defaultValue={board.key}
            maxLength={4}
            className="uppercase"
            required
          />
        </div>
        {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
        <div className="flex gap-2">
          <Button type="submit" size="sm" disabled={isPending}>
            {isPending ? "Saving…" : "Save"}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => setEditing(false)}
          >
            Cancel
          </Button>
        </div>
      </form>
    );
  }

  return (
    <div className="group relative rounded-lg border border-slate-200 bg-white p-4 hover:border-slate-300">
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="absolute right-3 top-3 rounded p-1 text-slate-400 opacity-0 hover:bg-slate-100 hover:text-slate-700 group-hover:opacity-100"
        aria-label="Edit Board"
      >
        <Pencil className="h-4 w-4" />
      </button>
      <Link href={`/b/${board.key}`} className="block">
        <div className="mb-1 inline-flex items-center rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs font-medium text-slate-500">
          {board.key}
        </div>
        <h3 className="font-medium text-slate-900">{board.name}</h3>
      </Link>
    </div>
  );
}
