import { createClient, type User } from "@supabase/supabase-js";
import type { Context } from "hono";
import type { AppEnv, VerifyToken } from "../types/hono";

export function getSupabase(ctx: Context<AppEnv>) {
  return createClient(ctx.env.SUPABASE_URL, ctx.env.SUPABASE_ANON_KEY);
}

export const verifyToken: VerifyToken = async (ctx, token) => {
  try {
    const supabase = getSupabase(ctx);
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) return null;
    return user as User;
  } catch {
    return null;
  }
};
