import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

import * as schema from "./schema";

type DrizzleDb = ReturnType<typeof drizzle<typeof schema>>;

let cached: DrizzleDb | undefined;

/**
 * Lazily create the DB client on first real use rather than at module import
 * time. `next build` evaluates route modules just to collect page config —
 * it must not require a live DATABASE_URL. Actual usage (dev server, a real
 * request, or a Server Action) still fails fast with a clear message.
 */
function getDb(): DrizzleDb {
  if (!cached) {
    const url = process.env.DATABASE_URL;
    if (!url) {
      throw new Error(
        "DATABASE_URL is not set. Copy .env.local.example to .env.local and fill in your Neon connection string.",
      );
    }
    cached = drizzle(neon(url), { schema });
  }
  return cached;
}

export const db: DrizzleDb = new Proxy({} as DrizzleDb, {
  get(_target, prop, receiver) {
    return Reflect.get(getDb() as object, prop, receiver);
  },
});
