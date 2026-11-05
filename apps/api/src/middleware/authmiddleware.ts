import type { Context, Next } from "hono";
import type { AppEnv } from "../types/hono";

export async function authMiddleware(ctx: Context<AppEnv>, next: Next) {
  const authHeader = ctx.req.header("Authorization");
  const match = authHeader?.match(/^Bearer\s+(.+)$/i);

  if (!match) {
    return ctx.json({ error: "Unauthorized" }, 401);
  }

  const user = await ctx.get("deps").verifyToken(ctx, match[1].trim());

  if (!user) {
    return ctx.json({ error: "Invalid token" }, 401);
  }

  ctx.set("user", user);
  await next();
}
