import { Hono } from "hono";
import type { AppEnv } from "../types/hono";

const authApp = new Hono<AppEnv>();

authApp.get("/me", async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ error: "Unauthenticated" }, 401);
  }
  return c.json({ id: user.id, email: user.email });
});

export default authApp;
