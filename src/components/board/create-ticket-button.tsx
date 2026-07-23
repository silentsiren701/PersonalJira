"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import { ColorPicker } from "@/components/board/color-picker";
import { TagCheckboxList } from "@/components/board/tag-checkbox-list";
import { createTicketAction } from "@/lib/actions/ticket-actions";
import type { Tag } from "@/lib/types";

export function CreateTicketButton({
  boardId,
  boardTags,
  variant = "column",
}: {
  boardId: string;
  boardTags: Tag[];
  variant?: "column" | "header";
}) {
  const [open, setOpen] = useState(false);
  const action = createTicketAction.bind(null, boardId);
  const [state, formAction, isPending] = useActionState(action, undefined);
  const wasPending = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (wasPending.current && !isPending && !state?.error) {
      setOpen(false);
      formRef.current?.reset();
    }
    wasPending.current = isPending;
  }, [isPending, state]);

  return (
    <>
      {variant === "column" ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex w-full items-center justify-center gap-1.5 rounded-md border border-dashed border-slate-300 py-2 text-sm text-slate-500 hover:border-slate-400 hover:text-slate-700"
        >
          <Plus className="h-4 w-4" />
          新建 Ticket
        </button>
      ) : (
        <Button type="button" size="sm" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" />
          新建 Ticket
        </Button>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="新建 Ticket">
        <form ref={formRef} action={formAction} className="space-y-4">
          <div>
            <Label htmlFor="new-ticket-title">标题</Label>
            <Input id="new-ticket-title" name="title" required autoFocus />
          </div>
          <div>
            <Label htmlFor="new-ticket-description">简介（Markdown）</Label>
            <textarea
              id="new-ticket-description"
              name="description"
              rows={5}
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
            />
          </div>
          <div>
            <Label>颜色</Label>
            <ColorPicker name="color" defaultValue="yellow" />
          </div>
          <div>
            <Label>Tag</Label>
            <TagCheckboxList tags={boardTags} />
          </div>
          {state?.error && (
            <p className="text-sm text-red-600">{state.error}</p>
          )}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setOpen(false)}
            >
              取消
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "创建中…" : "创建"}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
