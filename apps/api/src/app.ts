import { Hono } from "hono";
import { cors } from "hono/cors";
import { authMiddleware } from "./middleware/authmiddleware";
import authApp from "./routes/auth";
import customersApp from "./routes/customers";
import transactionsApp from "./routes/transactions";
import dashboardApp from "./routes/dashboard";
import auditLogsApp from "./routes/audit-logs";
import { getAuth } from "./lib/better-auth";
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
      exposeHeaders: ["set-auth-token"],
      credentials: true,
    }),
  );

  app.use("/customers/*", authMiddleware);
  app.use("/transactions/*", authMiddleware);
  app.use("/dashboard/*", authMiddleware);
  app.use("/auth/me", authMiddleware);
  app.use("/auth/logout", authMiddleware);
  app.use("/audit-logs/*", authMiddleware);

  app.route("/auth", authApp);
  app.route("/audit-logs", auditLogsApp);

  // Direct-navigate Google sign-in: the browser GETs this URL so the state
  // cookie is set same-site. Avoids cross-origin fetch cookie blocking that
  // causes state_mismatch when web and API are on different domains.
  app.get("/api/auth/redirect/google", async (ctx) => {
    const callbackURL =
      ctx.req.query("callbackURL") || trustedOrigins(ctx.env)[0] || "/";
    const { auth, connect, release } = getAuth(ctx.env);
    try {
      await connect();
      // Build an internal request that Better Auth can process.
      const internalReq = new Request(
        new URL("/api/auth/sign-in/social", ctx.req.url).href,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ provider: "google", callbackURL }),
        },
      );
      const res = await auth.handler(internalReq);
      // Forward the state cookie to the real browser response and redirect.
      const googleURL =
        res.headers.get("location") ||
        (await (res.json() as Promise<{ url?: string }>).then((d) => d.url));
      if (!googleURL) return ctx.json({ error: "OAuth init failed" }, 500);

      const headers = new Headers();
      const setCookie = res.headers.get("set-cookie");
      if (setCookie) headers.set("set-cookie", setCookie);
      headers.set("location", googleURL);
      return new Response(null, { status: 302, headers });
    } finally {
      await release();
    }
  });

  // Better Auth (Google-only OAuth) request handler. Per-request instance:
  // Workers secrets and the Hyperdrive connection only exist on `ctx.env`.
  app.all("/api/auth/*", async (ctx) => {
    const { auth, connect, release } = getAuth(ctx.env);
    try {
      await connect();
      const res = await auth.handler(ctx.req.raw);

      // After a successful OAuth callback, Better Auth redirects to the
      // callbackURL and sets a `set-auth-token` header with the Bearer token.
      // Because web and API are on different domains, the session cookie
      // (SameSite=Lax) won't be sent back in cross-origin fetches. Pass the
      // token via URL hash fragment so the web app can store it in localStorage.
      if (
        ctx.req.path.includes("/callback/") &&
        res.status >= 300 &&
        res.status < 400
      ) {
        const token = res.headers.get("set-auth-token");
        const location = res.headers.get("location");
        if (token && location) {
          const sep = location.includes("#") ? "&" : "#";
          const newHeaders = new Headers(res.headers);
          newHeaders.set(
            "location",
            `${location}${sep}token=${encodeURIComponent(token)}`,
          );
          return new Response(res.body, {
            status: res.status,
            headers: newHeaders,
          });
        }
      }

      return res;
    } finally {
      await release();
    }
  });
  app.route("/customers", customersApp);
  app.route("/transactions", transactionsApp);
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
