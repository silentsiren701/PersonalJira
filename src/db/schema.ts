import { relations, sql } from "drizzle-orm";
import {
  doublePrecision,
  check,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

/**
 * Fixed set of statuses a Ticket can be in. Deliberately not configurable per
 * Board — see docs/adr and CONTEXT.md ("Status").
 * UI labels: To Do / In Progress / Blocked / Closed.
 */
export const ticketStatusEnum = pgEnum("ticket_status", [
  "todo",
  "in_progress",
  "blocked",
  "closed",
]);

/**
 * Fixed sticky-note color palette, shared by Tickets and Tags. Purely visual,
 * never drives status/sort logic. See CONTEXT.md ("Ticket Color").
 */
export const stickyColorEnum = pgEnum("sticky_color", [
  "yellow",
  "pink",
  "blue",
  "green",
  "orange",
  "purple",
]);

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/**
 * A Board belongs to exactly one owner. There is no membership/collaboration
 * table in v1 — see CONTEXT.md ("Owner").
 */
export const boards = pgTable(
  "boards",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ownerId: uuid("owner_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    /** Up to 4 uppercase letters, mutable. Used to display `KEY-number`. */
    key: varchar("key", { length: 4 }).notNull(),
    /**
     * Atomic counter used to allocate the next Ticket's display number.
     * See docs/adr/0002-board-scoped-tags-and-per-board-ticket-numbering.md.
     */
    nextTicketNumber: integer("next_ticket_number").notNull().default(1),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [unique("boards_owner_key_unique").on(table.ownerId, table.key)],
);

/** A Tag always belongs to exactly one Board — never shared across Boards. */
export const tags = pgTable(
  "tags",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    boardId: uuid("board_id")
      .notNull()
      .references(() => boards.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    color: stickyColorEnum("color").notNull().default("yellow"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [unique("tags_board_name_unique").on(table.boardId, table.name)],
);

export const tickets = pgTable(
  "tickets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    boardId: uuid("board_id")
      .notNull()
      .references(() => boards.id, { onDelete: "cascade" }),
    /** Display number, unique per Board, allocated from boards.nextTicketNumber. */
    number: integer("number").notNull(),
    title: text("title").notNull(),
    /** Optional Markdown summary / design notes — not the progress log. */
    description: text("description").notNull().default(""),
    projectName: text("project_name").notNull().default(""),
    repositoryUrl: text("repository_url").notNull().default(""),
    status: ticketStatusEnum("status").notNull().default("todo"),
    color: stickyColorEnum("color").notNull().default("yellow"),
    /**
     * Manual sort order within (boardId, status). Fractional so a card can be
     * inserted between two neighbors without renumbering the whole column.
     */
    position: doublePrecision("position").notNull().default(0),
    /** Set when status transitions into 'closed', cleared otherwise. Drives the Kanban 7-day filter. */
    closedAt: timestamp("closed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique("tickets_board_number_unique").on(table.boardId, table.number),
  ],
);

/**
 * Chronological progress-log entries on a Ticket. See CONTEXT.md ("Update")
 * and docs/adr/0004-ticket-updates-and-english-status-labels.md.
 */
export const ticketUpdates = pgTable("ticket_updates", {
  id: uuid("id").primaryKey().defaultRandom(),
  ticketId: uuid("ticket_id")
    .notNull()
    .references(() => tickets.id, { onDelete: "cascade" }),
  /** Markdown body. */
  body: text("body").notNull(),
  source: text("source", { enum: ["user", "agent"] }).notNull().default("user"),
  agentName: text("agent_name"),
  details: text("details").notNull().default(""),
  requestId: uuid("request_id"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
}, (table) => [
  unique("ticket_updates_ticket_request_unique").on(table.ticketId, table.requestId),
  check("ticket_updates_source_check", sql`${table.source} in ('user', 'agent')`),
]);

/** A revocable access credential scoped to one ticket. Store hashes only. */
export const ticketAgentConnections = pgTable("ticket_agent_connections", {
  ticketId: uuid("ticket_id").primaryKey().references(() => tickets.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Many-to-many join between Tickets and Tags (no primary/secondary distinction). */
export const ticketTags = pgTable(
  "ticket_tags",
  {
    ticketId: uuid("ticket_id")
      .notNull()
      .references(() => tickets.id, { onDelete: "cascade" }),
    tagId: uuid("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.ticketId, table.tagId] })],
);

export const usersRelations = relations(users, ({ many }) => ({
  boards: many(boards),
}));

export const boardsRelations = relations(boards, ({ one, many }) => ({
  owner: one(users, { fields: [boards.ownerId], references: [users.id] }),
  tags: many(tags),
  tickets: many(tickets),
}));

export const tagsRelations = relations(tags, ({ one, many }) => ({
  board: one(boards, { fields: [tags.boardId], references: [boards.id] }),
  ticketTags: many(ticketTags),
}));

export const ticketsRelations = relations(tickets, ({ one, many }) => ({
  board: one(boards, { fields: [tickets.boardId], references: [boards.id] }),
  ticketTags: many(ticketTags),
  updates: many(ticketUpdates),
  agentConnection: one(ticketAgentConnections),
}));

export const ticketAgentConnectionsRelations = relations(ticketAgentConnections, ({ one }) => ({
  ticket: one(tickets, { fields: [ticketAgentConnections.ticketId], references: [tickets.id] }),
}));

export const ticketUpdatesRelations = relations(ticketUpdates, ({ one }) => ({
  ticket: one(tickets, {
    fields: [ticketUpdates.ticketId],
    references: [tickets.id],
  }),
}));

export const ticketTagsRelations = relations(ticketTags, ({ one }) => ({
  ticket: one(tickets, {
    fields: [ticketTags.ticketId],
    references: [tickets.id],
  }),
  tag: one(tags, { fields: [ticketTags.tagId], references: [tags.id] }),
}));
