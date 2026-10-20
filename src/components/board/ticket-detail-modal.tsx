"use client";

import { useState, useTransition } from "react";
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
import { UpdateChain } from "@/components/board/update-chain";
import { AgentConnection } from "@/components/board/agent-connection";
import {
  deleteTicketAction,
  patchTicketFieldsAction,
} from "@/lib/actions/ticket-actions";
import {
  STICKY_COLOR_CLASSES,
  type StickyColor,
  type Tag,
  type TicketWithTagsAndUpdates,
} from "@/lib/types";
import { cn } from "@/lib/utils";

export function TicketDetailModal({
  ticket,
  boardId,
  boardKey,
  boardTags,
  closeHref,
}: {
  ticket: TicketWithTagsAndUpdates | null;
  boardId: string;
  boardKey: string;
  boardTags: Tag[];
  closeHref: string;
}) {
  const router = useRouter();

  return (
    <Modal
      open={!!ticket}
      onClose={() => router.push(closeHref)}
      size="xl"
    >
      {ticket && (
        <TicketDetailPanel
          key={ticket.id}
          ticket={ticket}
          boardId={boardId}
          boardKey={boardKey}
          boardTags={boardTags}
          onDeleted={() => router.push(closeHref)}
          onClose={() => router.push(closeHref)}
        />
      )}
    </Modal>
  );
}

function TicketDetailPanel({
  ticket,
  boardId,
  boardKey,
  boardTags,
  onDeleted,
  onClose,
}: {
  ticket: TicketWithTagsAndUpdates;
  boardId: string;
  boardKey: string;
  boardTags: Tag[];
  onDeleted: () => void;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(ticket.title);
  const [description, setDescription] = useState(ticket.description);
  const [projectName, setProjectName] = useState(ticket.projectName);
  const [repositoryUrl, setRepositoryUrl] = useState(ticket.repositoryUrl);
  const [color, setColor] = useState<StickyColor>(ticket.color);
  const [selectedTagIds, setSelectedTagIds] = useState(
    () => new Set(ticket.tags.map((t) => t.id)),
  );
  const [editingDescription, setEditingDescription] = useState(
    ticket.description.length === 0,
  );
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [, startTransition] = useTransition();

  const [serverFields, setServerFields] = useState(() => ({
    title: ticket.title, description: ticket.description, projectName: ticket.projectName,
    repositoryUrl: ticket.repositoryUrl, color: ticket.color,
    tagIds: ticket.tags.map((tag) => tag.id).sort().join(","),
  }));
  const incoming = {
    title: ticket.title, description: ticket.description, projectName: ticket.projectName,
    repositoryUrl: ticket.repositoryUrl, color: ticket.color,
    tagIds: ticket.tags.map((tag) => tag.id).sort().join(","),
  };
  // Apply server changes to clean fields while keeping any local draft in progress.
  if (Object.keys(incoming).some((key) => incoming[key as keyof typeof incoming] !== serverFields[key as keyof typeof serverFields])) {
    setServerFields(incoming);
    if (title === serverFields.title) setTitle(incoming.title);
    if (description === serverFields.description) setDescription(incoming.description);
    if (projectName === serverFields.projectName) setProjectName(incoming.projectName);
    if (repositoryUrl === serverFields.repositoryUrl) setRepositoryUrl(incoming.repositoryUrl);
    if (color === serverFields.color) setColor(incoming.color);
    if ([...selectedTagIds].sort().join(",") === serverFields.tagIds) {
      setSelectedTagIds(new Set(ticket.tags.map((tag) => tag.id)));
    }
  }

  function patch(fields: Parameters<typeof patchTicketFieldsAction>[2]) {
    startTransition(async () => {
      const result = await patchTicketFieldsAction(ticket.id, boardId, fields);
      if (result?.error) setError(result.error);
      else setError(null);
    });
  }

  async function handleDelete() {
    if (
      !window.confirm(
        `Permanently delete ${boardKey}-${ticket.number}? This cannot be undone.`,
      )
    ) {
      return;
    }
    setIsDeleting(true);
    await deleteTicketAction(ticket.id, boardId);
    onDeleted();
  }

  function toggleTag(tagId: string) {
    setSelectedTagIds((prev) => {
      const next = new Set(prev);
      if (next.has(tagId)) next.delete(tagId);
      else next.add(tagId);
      const ids = [...next];
      patch({ tagIds: ids });
      return next;
    });
  }

  return (
    <div className="relative flex h-[min(85vh,720px)] flex-col md:flex-row">
      <button
        type="button"
        onClick={onClose}
        className="absolute right-3 top-3 z-20 rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 md:right-4 md:top-4"
        aria-label="Close"
      >
        ×
      </button>

      {/* Left: ticket body */}
      <div className="flex min-h-0 w-full flex-1 flex-col overflow-y-auto p-5 md:w-1/2 md:pr-4">
        <div className="mb-4 flex items-center justify-between gap-2 pr-8">
          <span className="font-mono text-xs font-medium text-slate-500">
            {boardKey}-{ticket.number}
          </span>
          <StatusSelect
            ticketId={ticket.id}
            boardId={boardId}
            status={ticket.status}
          />
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor={`title-${ticket.id}`}>Title</Label>
            <Input
              id={`title-${ticket.id}`}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={() => {
                const next = title.trim();
                if (!next || next === ticket.title) {
                  if (!next) setTitle(ticket.title);
                  return;
                }
                patch({ title: next });
              }}
              required
            />
          </div>

          <div>
            <Label htmlFor={`project-${ticket.id}`}>Project</Label>
            <Input id={`project-${ticket.id}`} value={projectName} maxLength={120}
              placeholder="e.g. PersonalJira"
              onChange={(event) => setProjectName(event.target.value)}
              onBlur={() => { if (projectName !== ticket.projectName) patch({ projectName }); }} />
            <Label htmlFor={`repository-${ticket.id}`} className="mt-2">Repository URL</Label>
            <Input id={`repository-${ticket.id}`} value={repositoryUrl} type="url"
              placeholder="https://github.com/you/project"
              onChange={(event) => setRepositoryUrl(event.target.value)}
              onBlur={() => { if (repositoryUrl !== ticket.repositoryUrl) patch({ repositoryUrl }); }} />
          </div>

          <AgentConnection ticketId={ticket.id} displayId={`${boardKey}-${ticket.number}`} connected={!!ticket.agentConnection} />

          <div>
            <div className="mb-1 flex items-center justify-between">
              <Label className="mb-0">Description</Label>
              <button
                type="button"
                onClick={() => setEditingDescription((v) => !v)}
                className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800"
              >
                <Pencil className="h-3 w-3" />
                {editingDescription ? "Preview" : "Edit"}
              </button>
            </div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={() => {
                if (description === ticket.description) return;
                patch({ description });
              }}
              rows={8}
              className={
                editingDescription
                  ? "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                  : "hidden"
              }
            />
            {!editingDescription && (
              <div className="prose prose-sm max-w-none rounded-md border border-slate-100 bg-slate-50 px-3 py-2 text-slate-700">
                {description ? (
                  <Markdown remarkPlugins={[remarkGfm]}>{description}</Markdown>
                ) : (
                  <p className="text-slate-400">No description</p>
                )}
              </div>
            )}
          </div>

          <div>
            <Label>Color</Label>
            <ColorPicker
              value={color}
              onChange={(next) => {
                setColor(next);
                if (next !== ticket.color) patch({ color: next });
              }}
            />
          </div>

          <div>
            <Label>Tags</Label>
            {boardTags.length === 0 ? (
              <p className="text-sm text-slate-400">No tags on this Board yet</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {boardTags.map((tag) => {
                  const classes = STICKY_COLOR_CLASSES[tag.color];
                  const selected = selectedTagIds.has(tag.id);
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => toggleTag(tag.id)}
                      className={cn(
                        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-300 transition",
                        classes.bg,
                        selected
                          ? "opacity-100 ring-2 ring-slate-500"
                          : "opacity-60",
                      )}
                    >
                      {tag.name}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="border-t border-slate-100 pt-3">
            <Button
              type="button"
              variant="danger"
              size="sm"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              <Trash2 className="h-3.5 w-3.5" />
              {isDeleting ? "Deleting…" : "Delete ticket"}
            </Button>
          </div>
        </div>
      </div>

      {/* Right: Update chain */}
      <div className="min-h-0 w-full flex-1 md:w-1/2">
        <UpdateChain
          ticketId={ticket.id}
          boardId={boardId}
          updates={ticket.updates}
          ticketUpdatedAt={ticket.updatedAt}
          agentConnected={!!ticket.agentConnection}
        />
      </div>
    </div>
  );
}
