import { Context, Next } from "hono";
import { getSupabase } from "../lib/supabase";
import type { AppEnv } from "../types/hono";

export async function authMiddleware(ctx: Context<AppEnv>, next: Next) {
  const authHeader = ctx.req.header("Authorization");  

  if (!authHeader) {
    return ctx.json({ error: "Unauthorized" }, 401);
  }

  const token = authHeader.replace("Bearer ", "");

  const supabase = getSupabase(ctx);
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user) {
    return ctx.json({ error: "Invalid token" }, 401);
  }

  ctx.set("user", user);

  await next();
}
