import { config } from "dotenv";

// drizzle-kit runs outside the Next.js dev server, so .env.local isn't
// auto-loaded the way it is for `next dev` — load it explicitly here.
config({ path: ".env.local" });

import { defineConfig } from "drizzle-kit";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL is not set. Copy .env.local.example to .env.local and fill in your Neon connection string.",
  );
}

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
  strict: true,
  verbose: true,
});
