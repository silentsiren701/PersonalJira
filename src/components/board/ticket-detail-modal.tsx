"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import { ColorPicker } from "@/components/board/color-picker";
import { StatusSelect } from "@/components/board/status-select";
import { TagCheckboxList } from "@/components/board/tag-checkbox-list";
import {
  deleteTicketAction,
  updateTicketAction,
} from "@/lib/actions/ticket-actions";
import type { Tag, TicketWithTags } from "@/lib/types";

export function TicketDetailModal({
  ticket,
  boardId,
  boardKey,
  boardTags,
  closeHref,
}: {
  ticket: TicketWithTags | null;
  boardId: string;
  boardKey: string;
  boardTags: Tag[];
  closeHref: string;
}) {
  const router = useRouter();

  return (
    <Modal open={!!ticket} onClose={() => router.push(closeHref)}>
      {ticket && (
        <TicketDetailForm
          key={ticket.id}
          ticket={ticket}
          boardId={boardId}
          boardKey={boardKey}
          boardTags={boardTags}
          onDeleted={() => router.push(closeHref)}
        />
      )}
    </Modal>
  );
}

function TicketDetailForm({
  ticket,
  boardId,
  boardKey,
  boardTags,
  onDeleted,
}: {
  ticket: TicketWithTags;
  boardId: string;
  boardKey: string;
  boardTags: Tag[];
  onDeleted: () => void;
}) {
  const [editingDescription, setEditingDescription] = useState(
    ticket.description.length === 0,
  );
  const action = updateTicketAction.bind(null, ticket.id, boardId);
  const [state, formAction, isPending] = useActionState(action, undefined);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    if (!window.confirm(`确定要永久删除 ${boardKey}-${ticket.number} 吗？此操作无法撤销。`)) {
      return;
    }
    setIsDeleting(true);
    await deleteTicketAction(ticket.id, boardId);
    onDeleted();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-xs font-medium text-slate-500">
          {boardKey}-{ticket.number}
        </span>
        <StatusSelect
          ticketId={ticket.id}
          boardId={boardId}
          status={ticket.status}
        />
      </div>

      <form action={formAction} className="space-y-4">
        <div>
          <Label htmlFor={`title-${ticket.id}`}>标题</Label>
          <Input
            id={`title-${ticket.id}`}
            name="title"
            defaultValue={ticket.title}
            required
          />
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between">
            <Label className="mb-0">简介（Markdown）</Label>
            <button
              type="button"
              onClick={() => setEditingDescription((v) => !v)}
              className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800"
            >
              <Pencil className="h-3 w-3" />
              {editingDescription ? "预览" : "编辑"}
            </button>
          </div>
          <textarea
            name="description"
            defaultValue={ticket.description}
            rows={8}
            className={
              editingDescription
                ? "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                : "hidden"
            }
          />
          {!editingDescription && (
            <div className="prose prose-sm max-w-none rounded-md border border-slate-100 bg-slate-50 px-3 py-2 text-slate-700">
              {ticket.description ? (
                <Markdown remarkPlugins={[remarkGfm]}>
                  {ticket.description}
                </Markdown>
              ) : (
                <p className="text-slate-400">没有简介</p>
              )}
            </div>
          )}
        </div>

        <div>
          <Label>颜色</Label>
          <ColorPicker name="color" defaultValue={ticket.color} />
        </div>

        <div>
          <Label>Tag</Label>
          <TagCheckboxList
            tags={boardTags}
            selectedTagIds={ticket.tags.map((t) => t.id)}
          />
        </div>

        {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

        <div className="flex items-center justify-between border-t border-slate-100 pt-3">
          <Button
            type="button"
            variant="danger"
            size="sm"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            <Trash2 className="h-3.5 w-3.5" />
            {isDeleting ? "删除中…" : "永久删除"}
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? "保存中…" : "保存"}
          </Button>
        </div>
      </form>
    </div>
  );
}
