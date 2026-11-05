import type { Context } from "hono";
import type { WithDb } from "../db";

export type AuthUser = { id: string; email: string };

export type Bindings = {
  HYPERDRIVE: Hyperdrive;
  TRUSTED_ORIGINS?: string;
  BETTER_AUTH_SECRET?: string;
  BETTER_AUTH_URL?: string;
  BACKUP_BUCKET?: R2Bucket;
  // Legacy source kept read-only during migration; never used for verification.
  SUPABASE_URL?: string;
  SUPABASE_ANON_KEY?: string;
};

export type VerifyToken = (
  ctx: Context<AppEnv>,
  token: string,
) => Promise<AuthUser | null>;

export type AppDependencies = {
  verifyToken: VerifyToken;
  withDb: WithDb;
};

export type Variables = {
  user: AuthUser;
  deps: AppDependencies;
};

export type AppEnv = {
  Bindings: Bindings;
  Variables: Variables;
};
