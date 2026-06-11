import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";
import type { AppEnv } from "../types/hono";
import type { Context } from "hono";

export function getDb(ctx: Context<AppEnv>) {
  const pool = new Pool({
    connectionString: ctx.env.HYPERDRIVE.connectionString,
  });
  return drizzle(pool, { schema });
}
