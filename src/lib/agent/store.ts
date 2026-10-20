import { eq } from "drizzle-orm";

import { db } from "@/db";
import { boards, ticketAgentConnections, tickets } from "@/db/schema";
import { addTicketUpdate, editTicketUpdate, getTicketDto, patchTicket, TicketOperationError } from "@/lib/ticket-service";
import { hashAgentToken } from "./credentials";
import type { AgentGrant, AgentStore } from "./validation";

async function readTicket(grant: AgentGrant) {
  const ticket = await getTicketDto(grant.ticketId, grant.boardId);
  if (!ticket) throw new TicketOperationError("Ticket not found");
  return ticket;
}

export function createAgentStore(): AgentStore {
  return {
    async authenticate(token) {
      const [grant] = await db.select({ ticketId: tickets.id, boardId: boards.id, boardKey: boards.key })
        .from(ticketAgentConnections)
        .innerJoin(tickets, eq(tickets.id, ticketAgentConnections.ticketId))
        .innerJoin(boards, eq(boards.id, tickets.boardId))
        .where(eq(ticketAgentConnections.tokenHash, hashAgentToken(token))).limit(1);
      return grant ?? null;
    },
    getTicket: readTicket,
    async updateTicket(grant, input) {
      await patchTicket(grant, input.changes);
      return readTicket(grant);
    },
    async updateItem(grant, input) {
      await editTicketUpdate(grant, input.updateId, { body: input.body, details: input.details });
      return readTicket(grant);
    },
    async addUpdate(grant, input) {
      const saved = await addTicketUpdate(grant, {
        body: input.body,
        source: "agent", agentName: input.agentName, requestId: input.requestId,
      });
      return { ...saved, ticketId: grant.ticketId };
    },
  };
}
