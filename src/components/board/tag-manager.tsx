"use client";

import { useActionState, useState } from "react";
import { Tags as TagsIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import { ColorPicker } from "@/components/board/color-picker";
import { TagPill } from "@/components/board/tag-pill";
import { createTagAction, deleteTagAction } from "@/lib/actions/tag-actions";
import type { Tag } from "@/lib/types";

export function TagManager({
  boardId,
  tags,
}: {
  boardId: string;
  tags: Tag[];
}) {
  const [open, setOpen] = useState(false);
  const action = createTagAction.bind(null, boardId);
  const [state, formAction, isPending] = useActionState(action, undefined);

  return (
    <>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={() => setOpen(true)}
      >
        <TagsIcon className="h-4 w-4" />
        Manage Tags
      </Button>

      <Modal open={open} onClose={() => setOpen(false)} title="Manage Tags">
        <div className="mb-4 flex flex-wrap gap-2">
          {tags.length === 0 && (
            <p className="text-sm text-slate-400">No tags yet</p>
          )}
          {tags.map((tag) => (
            <TagPill
              key={tag.id}
              tag={tag}
              onRemove={() => {
                if (
                  window.confirm(
                    `Delete tag "${tag.name}"? Tickets keep their other tags.`,
                  )
                ) {
                  void deleteTagAction(boardId, tag.id);
                }
              }}
            />
          ))}
        </div>

        <form
          action={formAction}
          className="flex items-end gap-3 border-t border-slate-100 pt-4"
        >
          <div className="flex-1">
            <Label htmlFor="tag-name">New tag</Label>
            <Input id="tag-name" name="name" required />
          </div>
          <ColorPicker name="color" defaultValue="blue" />
          <Button type="submit" size="sm" disabled={isPending}>
            Add
          </Button>
        </form>
        {state?.error && (
          <p className="mt-2 text-sm text-red-600">{state.error}</p>
        )}
      </Modal>
    </>
  );
}
