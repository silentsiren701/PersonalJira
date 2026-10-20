"use client";

import { useState, useTransition } from "react";
import { Bot, Check, Copy } from "lucide-react";

import { Button } from "@/components/ui/button";
import { createAgentConnectionAction, revokeAgentConnectionAction } from "@/lib/actions/agent-actions";
import { agentSetup } from "@/lib/agent/setup";

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState<string | null>(null);
  const [error, setError] = useState("");
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(text);
      setError("");
    } catch { setError("Copy failed — select the text to copy"); }
  }
  return <Button type="button" variant="secondary" size="sm" onClick={copy}>
    {copied === text ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
    {error || (copied === text ? "Copied" : label)}
  </Button>;
}

export function AgentConnection({ ticketId, displayId, connected }: {
  ticketId: string;
  displayId: string;
  connected: boolean;
}) {
  const [token, setToken] = useState<string | null>(null);
  const [setup, setSetup] = useState<ReturnType<typeof agentSetup> | null>(null);
  const [error, setError] = useState("");
  const [client, setClient] = useState<"codex" | "claude">("codex");
  const [isPending, startTransition] = useTransition();

  function generate() {
    setError("");
    startTransition(async () => {
      try {
        const result = await createAgentConnectionAction(ticketId);
        if (result.error) { setError(result.error); return; }
        setToken(result.token ?? null);
      } catch { setError("Could not create a connection. Please try again."); }
    });
  }

  function revoke() {
    setError("");
    startTransition(async () => {
      try {
        const result = await revokeAgentConnectionAction(ticketId);
        if (result.error) { setError(result.error); return; }
        setToken(null);
      } catch { setError("Could not revoke this connection. Please try again."); }
    });
  }

  function openConnection() {
    if (setup) { setSetup(null); return; }
    setSetup(agentSetup(window.location.origin, displayId));
    if (!connected && !token) generate();
  }

  return <div className="rounded-lg border border-slate-200 bg-slate-50">
    <div className="flex items-center gap-2 px-3 py-2.5">
      <Button type="button" size="sm" variant="secondary" disabled={isPending} onClick={openConnection}
        aria-expanded={!!setup}>
        <Bot className="h-4 w-4" /> Give to Agent
      </Button>
      {connected && <span className="text-xs text-emerald-700">Access enabled</span>}
    </div>
    {setup && <>
    <div className="space-y-3 border-t border-slate-200 p-3 text-xs text-slate-600">
      <p>The token lets your agent read and modify this ticket and add progress entries.</p>
      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" disabled={isPending} onClick={generate}>
          {isPending ? "Working…" : connected ? "Replace access token" : "Create access token"}
        </Button>
        {connected && <Button type="button" size="sm" variant="secondary" disabled={isPending} onClick={revoke}>Revoke access</Button>}
      </div>
      {connected && <p>Replacing the token disconnects clients using the old one.</p>}
      {error && <p role="alert" className="text-red-600">{error}</p>}
      {token && <div className="space-y-2 rounded-md border border-amber-200 bg-amber-50 p-2.5">
        <p className="font-medium text-amber-900">Copy this token now. It is shown only in this session.</p>
        <input aria-label="Ticket access token" className="w-full rounded border border-amber-200 bg-white px-2 py-1.5 font-mono" readOnly type="password" value={token} autoComplete="off" />
        <CopyButton text={token} label="Copy token" />
      </div>}
        <p>1. Set <code className="break-all font-mono">{setup.envName}</code> to your token in the environment that launches your agent.</p>
        <div className="flex gap-2" role="group" aria-label="Agent configuration">
          <Button type="button" size="sm" variant={client === "codex" ? "primary" : "secondary"} onClick={() => setClient("codex")}>Codex</Button>
          <Button type="button" size="sm" variant={client === "claude" ? "primary" : "secondary"} onClick={() => setClient("claude")}>Claude Code</Button>
        </div>
        <p>2. Add this to {client === "codex" ? "~/.codex/config.toml" : "your project's .mcp.json"}, merging it with any existing servers. Restart your agent to load it.</p>
        <pre tabIndex={0} className="max-h-44 overflow-auto rounded-md bg-slate-900 p-2.5 text-[11px] text-slate-100">{setup[client]}</pre>
        <CopyButton text={setup[client]} label="Copy configuration" />
        <p>3. Copy this task prompt to your agent.</p>
        <CopyButton text={setup.prompt} label="Copy task prompt" />
        <details><summary>Show prompt</summary>
          <p className="mt-2 whitespace-pre-wrap break-words">{setup.prompt}</p>
        </details>
        <p>When switching tickets, replace the token used by this connection and reload the MCP client configuration.</p>
    </div>
    </>}
  </div>;
}
