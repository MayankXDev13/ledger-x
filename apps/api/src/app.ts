import { Hono } from "hono";
import { cors } from "hono/cors";
import { authMiddleware } from "./middleware/authmiddleware";
import authApp from "./routes/auth";
import customersApp from "./routes/customers";
import transactionsApp from "./routes/transactions";
import tagsApp from "./routes/tags";
import dashboardApp from "./routes/dashboard";
import auditLogsApp from "./routes/audit-logs";
import { withDb as defaultWithDb } from "./db";
import { verifyToken as defaultVerifyToken } from "./lib/auth";
import { ApiError } from "./lib/errors";
import type { AppDependencies, AppEnv, Bindings } from "./types/hono";

const DEFAULT_TRUSTED_ORIGIN = "http://localhost:3000";

function trustedOrigins(env: Bindings): string[] {
  return (env.TRUSTED_ORIGINS ?? DEFAULT_TRUSTED_ORIGIN)
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export function createApp(overrides: Partial<AppDependencies> = {}) {
  const deps: AppDependencies = {
    verifyToken: overrides.verifyToken ?? defaultVerifyToken,
    withDb: overrides.withDb ?? defaultWithDb,
  };

  const app = new Hono<AppEnv>();

  app.use("*", async (ctx, next) => {
    ctx.set("deps", deps);
    await next();
  });

  app.use(
    "*",
    cors({
      origin: (origin, ctx) => {
        if (!origin) return undefined;

        const allowed = trustedOrigins(ctx.env as Bindings);
        return allowed.includes(origin) ? origin : undefined;
      },
      allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowHeaders: ["Content-Type", "Authorization"],
      credentials: true,
    }),
  );

  app.use("/customers/*", authMiddleware);
  app.use("/transactions/*", authMiddleware);
  app.use("/transaction-tags/*", authMiddleware);
  app.use("/dashboard/*", authMiddleware);
  app.use("/auth/me", authMiddleware);
  app.use("/auth/logout", authMiddleware);
  app.use("/audit-logs/*", authMiddleware);

  app.route("/auth", authApp);
  app.route("/audit-logs", auditLogsApp);
  app.route("/customers", customersApp);
  app.route("/transactions", transactionsApp);
  app.route("/transaction-tags", tagsApp);
  app.route("/dashboard", dashboardApp);

  app.notFound((ctx) => ctx.json({ error: "Not found" }, 404));

  app.onError((err, ctx) => {
    if (err instanceof ApiError) {
      return ctx.json(
        {
          error: err.message,
          ...(err.details ? { details: err.details } : {}),
        },
        err.status,
      );
    }

    console.error("[api] unhandled error", err);
    return ctx.json({ error: "Internal server error" }, 500);
  });

  return app;
}

const app = createApp();

export default app;
