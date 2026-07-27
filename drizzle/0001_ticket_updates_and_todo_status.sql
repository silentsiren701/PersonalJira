-- Rename ticket_status enum value not_started → todo, and add ticket_updates.
-- Postgres cannot DROP an enum value in-place; recreate the type.

ALTER TABLE "tickets" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "tickets" ALTER COLUMN "status" TYPE text USING "status"::text;
UPDATE "tickets" SET "status" = 'todo' WHERE "status" = 'not_started';
DROP TYPE "public"."ticket_status";
CREATE TYPE "public"."ticket_status" AS ENUM('todo', 'in_progress', 'blocked', 'closed');
ALTER TABLE "tickets" ALTER COLUMN "status" TYPE "public"."ticket_status" USING "status"::"public"."ticket_status";
ALTER TABLE "tickets" ALTER COLUMN "status" SET DEFAULT 'todo'::"public"."ticket_status";

CREATE TABLE IF NOT EXISTS "ticket_updates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ticket_id" uuid NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ticket_updates" ADD CONSTRAINT "ticket_updates_ticket_id_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."tickets"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
