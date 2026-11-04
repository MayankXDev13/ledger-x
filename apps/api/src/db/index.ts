import { Client } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema";
import { Context } from "hono";
import type { AppEnv } from "../types/hono";

export async function getDb(ctx: Context<AppEnv>) {
  const client = new Client({
    connectionString: ctx.env.HYPERDRIVE.connectionString,
  });

  await client.connect();

  return drizzle(client, { schema });
}