"use client";

import {
  useActionState,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useTransition,
} from "react";
import { Bot, Pencil, Send, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { Button } from "@/components/ui/button";
import { LocalTime } from "@/components/ui/local-time";
import {
  createUpdateAction,
  deleteUpdateAction,
  editUpdateAction,
} from "@/lib/actions/update-actions";
import { type TicketUpdate } from "@/lib/types";
import { cn } from "@/lib/utils";

export function UpdateChain({
  ticketId,
  boardId,
  updates,
  ticketUpdatedAt,
  agentConnected,
}: {
  ticketId: string;
  boardId: string;
  updates: TicketUpdate[];
  ticketUpdatedAt: Date | string;
  agentConnected: boolean;
}) {
  const listRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!agentConnected) return;
    const refresh = () => { if (!document.hidden) router.refresh(); };
    const timer = window.setInterval(refresh, 10000);
    window.addEventListener("focus", refresh);
    return () => { window.clearInterval(timer); window.removeEventListener("focus", refresh); };
  }, [agentConnected, router]);

  useLayoutEffect(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [updates.length, ticketId]);

  return (
    <div className="flex h-full min-h-[280px] flex-col border-t border-slate-200 bg-slate-50 md:border-l md:border-t-0">
      <div className="shrink-0 border-b border-slate-200 px-4 py-3 text-sm font-medium text-slate-700">Progress
        {agentConnected && <span className="ml-2 text-[11px] font-normal text-slate-400">Syncs every 10s</span>}
      </div>
      <div ref={listRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
        {updates.length === 0 && <p className="py-8 text-center text-sm text-slate-400">Add progress below, or connect an agent.</p>}
        {updates.map((update) => (
          <UpdateBubble
            key={update.id}
            update={update}
            ticketId={ticketId}
            boardId={boardId}
          />
        ))}
      </div>

      <UpdateComposer ticketId={ticketId} boardId={boardId} />

      <p className="shrink-0 px-4 pb-3 text-right text-[11px] text-slate-400">
        Updated <LocalTime value={ticketUpdatedAt} />
      </p>
    </div>
  );
}

function UpdateBubble({
  update,
  ticketId,
  boardId,
}: {
  update: TicketUpdate;
  ticketId: string;
  boardId: string;
}) {
  const [editing, setEditing] = useState(false);
  const [isDeleting, startDelete] = useTransition();
  const action = editUpdateAction.bind(null, update.id, ticketId, boardId);
  const [state, formAction, isPending] = useActionState(action, undefined);
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !isPending && !state?.error) {
      setEditing(false);
    }
    wasPending.current = isPending;
  }, [isPending, state]);

  function handleDelete() {
    if (!window.confirm("Delete this update? This cannot be undone.")) return;
    startDelete(async () => {
      await deleteUpdateAction(update.id, ticketId, boardId);
    });
  }

  return (
    <div
      className={cn(
        "group relative w-fit min-w-36 max-w-[92%] rounded-2xl border px-3 py-2 shadow-sm",
        update.source === "agent" ? "mr-auto rounded-bl-md border-indigo-100 bg-white" : "ml-auto rounded-br-md border-slate-200 bg-slate-100",
      )}
    >
      <div className="mb-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 pr-12 text-[10px] text-slate-500">
        <span className="inline-flex items-center gap-1 font-medium">{update.source === "agent" && <Bot className="h-3 w-3" />}{update.source === "agent" ? update.agentName || "Agent" : "You"}</span>
        <LocalTime value={update.createdAt} />
      </div>
      {!editing && (
        <div className="absolute right-2 top-2 flex gap-1 opacity-70 transition group-hover:opacity-100 group-focus-within:opacity-100 md:opacity-0">
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            aria-label="Edit update"
          >
            <Pencil className="h-3 w-3" />
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
            aria-label="Delete update"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      )}

      {editing ? (
        <form action={formAction} className="space-y-2">
          <textarea
            name="body"
            defaultValue={update.body}
            rows={4}
            required
            className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
          />
          {update.source === "agent" && <>
            <label htmlFor={`details-${update.id}`} className="text-xs text-slate-500">Details</label>
            <textarea id={`details-${update.id}`} name="details" defaultValue={update.details} rows={6} maxLength={20000}
              className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-2 text-sm" />
          </>}
          {state?.error && (
            <p className="text-xs text-red-600">{state.error}</p>
          )}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => setEditing(false)}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={isPending}>
              {isPending ? "Saving…" : "Save"}
            </Button>
          </div>
        </form>
      ) : (
        <div className="prose prose-sm max-w-none break-words text-slate-800 [overflow-wrap:anywhere]">
          <Markdown remarkPlugins={[remarkGfm]}>{update.body}</Markdown>
          {update.details && <details className="mt-2 border-t border-slate-200 pt-2">
            <summary className="cursor-pointer text-xs font-medium text-indigo-700">Details</summary>
            <Markdown remarkPlugins={[remarkGfm]}>{update.details}</Markdown>
          </details>}
        </div>
      )}
    </div>
  );
}

function UpdateComposer({
  ticketId,
  boardId,
}: {
  ticketId: string;
  boardId: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const action = createUpdateAction.bind(null, ticketId, boardId);
  const [state, formAction, isPending] = useActionState(action, undefined);
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !isPending && !state?.error) {
      formRef.current?.reset();
    }
    wasPending.current = isPending;
  }, [isPending, state]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="shrink-0 border-t border-slate-200 bg-white p-3"
    >
      <div className="flex gap-2">
        <textarea
          name="body"
          rows={2}
          placeholder="Write an update…"
          required
          className="min-h-[2.5rem] flex-1 resize-y rounded-md border border-slate-300 px-2.5 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
        />
        <Button
          type="submit"
          size="sm"
          disabled={isPending}
          className="self-end"
          aria-label="Send update"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
      {state?.error && (
        <p className="mt-1 text-xs text-red-600">{state.error}</p>
      )}
    </form>
  );
}
