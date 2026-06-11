import type { User } from '@supabase/supabase-js';

export type Bindings = {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  ledger_x_db: D1Database;
};

export type Variables = {
  user: User;
};

export type AppEnv = {
  Bindings: Bindings;
  Variables: Variables;
};