import { Client as PgClient } from "pg";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import type { Context } from "hono";
import * as schema from "./schema";
import type { AppEnv } from "../types/hono";

export type Db = NodePgDatabase<typeof schema>;

export type WithDb = <T>(
  ctx: Context<AppEnv>,
  fn: (db: Db) => Promise<T>,
) => Promise<T>;

export interface DbClient {
  connect(): Promise<unknown>;
  end(): Promise<void>;
}

export type DbClientFactory = (connectionString: string) => DbClient;
export type DbFactory = (client: DbClient) => Db;

const defaultClientFactory: DbClientFactory = (connectionString) =>
  new PgClient({ connectionString });

const defaultDbFactory: DbFactory = (client) =>
  drizzle(client as unknown as PgClient, { schema });

export function createWithDb(
  createClient: DbClientFactory = defaultClientFactory,
  createDb: DbFactory = defaultDbFactory,
): WithDb {
  return async (ctx, fn) => {
    const client = createClient(ctx.env.HYPERDRIVE.connectionString);

    try {
      await client.connect();
      return await fn(createDb(client));
    } finally {
      const closing = client.end();
      try {
        ctx.executionCtx.waitUntil(closing);
      } catch {
        // Contexts created outside the Workers runtime have no executionCtx.
        await closing;
      }
    }
  };
}

export const withDb = createWithDb();
