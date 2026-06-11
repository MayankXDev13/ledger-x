import { drizzle } from 'drizzle-orm/d1';
import * as schema from './schema';
import type { AppEnv } from '../types/hono';
import type { Context } from 'hono';

export function getDb(ctx: Context<AppEnv>) {
  return drizzle(ctx.env.ledger_x_db, { schema });
}
