export function agentSetup(origin: string, displayId: string) {
  const serverName = "ticket-record";
  const envName = "TICKET_RECORD_TOKEN";
  const url = new URL("/api/mcp", origin).toString();
  return {
    envName,
    serverName,
    codex: `[mcp_servers.${serverName}]\nurl = ${JSON.stringify(url)}\nbearer_token_env_var = "${envName}"`,
    claude: JSON.stringify({ mcpServers: { [serverName]: {
      type: "http", url, headers: { Authorization: `Bearer \${${envName}}` },
    } } }, null, 2),
    prompt: `Work on ticket ${displayId} using MCP server ${serverName}. Call get_current_ticket and confirm its displayId is ${displayId} before making changes. Use update_current_ticket to change ticket fields, update_ticket_item to edit an existing progress entry, and add_ticket_update to append progress to this ticket. You may provide a requestId UUID to avoid duplicates when retrying the same entry.`,
  };
}
