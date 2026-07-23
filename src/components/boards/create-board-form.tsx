"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createBoardAction } from "@/lib/actions/board-actions";

export function CreateBoardForm() {
  const [state, formAction, isPending] = useActionState(
    createBoardAction,
    undefined,
  );

  return (
    <form
      action={formAction}
      className="flex flex-wrap items-end gap-3 rounded-lg border border-dashed border-slate-300 p-4"
    >
      <div className="min-w-[160px] flex-1">
        <Label htmlFor="board-name">Board 名称</Label>
        <Input id="board-name" name="name" placeholder="比如：公司事务" required />
      </div>
      <div className="w-28">
        <Label htmlFor="board-key">Key</Label>
        <Input
          id="board-key"
          name="key"
          placeholder="WORK"
          maxLength={4}
          className="uppercase"
          required
        />
      </div>
      <Button type="submit" disabled={isPending}>
        {isPending ? "创建中…" : "创建 Board"}
      </Button>
      {state?.error && (
        <p className="w-full text-sm text-red-600">{state.error}</p>
      )}
    </form>
  );
}
