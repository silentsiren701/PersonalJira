import { z } from "zod";

import { updateBodySchema, updateTicketSchema } from "@/lib/validation";
import type { TicketDto } from "@/lib/ticket-service";

export const currentTicketInputSchema = z.object({}).strict();
export const updateCurrentTicketInputSchema = z.object({
  changes: updateTicketSchema.strict().refine(
    (value) => Object.values(value).some((field) => field !== undefined),
    "Supply at least one field to update",
  ),
}).strict();

export const updateTicketItemInputSchema = z.object({
  updateId: z.string().uuid().describe("The ID of a progress entry returned by get_current_ticket"),
  body: updateBodySchema,
  details: z.string().max(20000).optional(),
}).strict();

export const addTicketUpdateInputSchema = z.object({
  body: updateBodySchema.describe("The Markdown entry to append to this ticket's progress log"),
  agentName: z.string().trim().min(1).max(80).default("Agent"),
  requestId: z.string().uuid().optional().describe("Optional UUID to deduplicate retries of the same entry"),
}).strict();

export type AgentGrant = { ticketId: string; boardId: string; boardKey: string };

export interface AgentStore {
  authenticate(token: string): Promise<AgentGrant | null>;
  getTicket(grant: AgentGrant): Promise<TicketDto>;
  updateTicket(grant: AgentGrant, input: z.infer<typeof updateCurrentTicketInputSchema>): Promise<TicketDto>;
  updateItem(grant: AgentGrant, input: z.infer<typeof updateTicketItemInputSchema>): Promise<TicketDto>;
  addUpdate(grant: AgentGrant, input: z.infer<typeof addTicketUpdateInputSchema>): Promise<{ id: string; ticketId: string; duplicate: boolean }>;
}
