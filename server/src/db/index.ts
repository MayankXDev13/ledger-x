import { drizzle } from 'drizzle-orm/d1';
import * as schema from './schema';

export interface Env {
	ledger_x_db: D1Database;
}

export default {
	async fetch(request: Request, env: Env) {
		const db = drizzle(env.auth_hono, { schema: schema });
	},
};