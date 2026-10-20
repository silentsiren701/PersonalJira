CREATE TABLE "ticket_agent_connections" (
	"ticket_id" uuid PRIMARY KEY NOT NULL,
	"token_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ticket_agent_connections_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
-- Add Agent connection and progress fields to the existing ticket tables.
ALTER TABLE "ticket_updates" ADD COLUMN "source" text DEFAULT 'user' NOT NULL;
--> statement-breakpoint
ALTER TABLE "ticket_updates" ADD COLUMN "agent_name" text;--> statement-breakpoint
ALTER TABLE "ticket_updates" ADD COLUMN "details" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "ticket_updates" ADD COLUMN "request_id" uuid;--> statement-breakpoint
ALTER TABLE "ticket_updates" ADD CONSTRAINT "ticket_updates_ticket_request_unique" UNIQUE("ticket_id", "request_id");--> statement-breakpoint
ALTER TABLE "ticket_updates" ADD CONSTRAINT "ticket_updates_source_check" CHECK ("source" in ('user', 'agent'));--> statement-breakpoint
ALTER TABLE "tickets" ADD COLUMN "project_name" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "tickets" ADD COLUMN "repository_url" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "ticket_agent_connections" ADD CONSTRAINT "ticket_agent_connections_ticket_id_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."tickets"("id") ON DELETE cascade ON UPDATE no action;
