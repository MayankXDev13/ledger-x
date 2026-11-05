import type { User } from "@supabase/supabase-js";
import type { Context } from "hono";
import type { WithDb } from "../db";

export type Bindings = {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  HYPERDRIVE: Hyperdrive;
  TRUSTED_ORIGINS?: string;
};

export type VerifyToken = (
  ctx: Context<AppEnv>,
  token: string,
) => Promise<User | null>;

export type AppDependencies = {
  verifyToken: VerifyToken;
  withDb: WithDb;
};

export type Variables = {
  user: User;
  deps: AppDependencies;
};

export type AppEnv = {
  Bindings: Bindings;
  Variables: Variables;
};
