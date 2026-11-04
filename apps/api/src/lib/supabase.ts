import { createClient } from "@supabase/supabase-js";
import type { Context } from "hono";
import type { AppEnv } from "../types/hono";

export function getSupabase(ctx: Context<AppEnv>) {
  return createClient(
    ctx.env.SUPABASE_URL,
    ctx.env.SUPABASE_ANON_KEY
  );
}