import { Hono } from "hono";
import { readFeatureFlags } from "../lib/feature-flags";
import type { AppEnv } from "../types/hono";

const featureFlagsApp = new Hono<AppEnv>();

// GET /feature-flags - The administrator-owned flag registry.
//
// The registry holds no user data, so it is not behind the auth middleware:
// a client can read it before sign-in, and knowing which features a
// deployment offers never depends on who is asking.
featureFlagsApp.get("/", async (ctx) => {
  const { withDb } = ctx.get("deps");

  const flags = await withDb(ctx, (db) => readFeatureFlags(db));

  return ctx.json({ flags });
});

export default featureFlagsApp;
