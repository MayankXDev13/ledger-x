import { Hono } from "hono";
import type { AppEnv } from "../types/hono";
import { ApiError } from "../lib/errors";
import { writeAudit } from "../lib/audit";
import { getAuth } from "../lib/better-auth";

const authApp = new Hono<AppEnv>();

function gone(): never {
  throw new ApiError(
    410,
    "Password authentication is removed. Use Google sign-in.",
  );
}

authApp.get("/me", async (c) => {
  const u = c.get("user");
  if (!u) return c.json({ error: "Unauthenticated" }, 401);
  return c.json({
    id: u.id,
    email: u.email,
    name: u.name ?? null,
    image: u.image ?? null,
  });
});

authApp.post("/logout", async (c) => {
  const u = c.get("user");
  try {
    const { auth, connect, release } = getAuth(c.env);
    try {
      await connect();
      await auth.api.signOut({ headers: c.req.raw.headers });
    } finally {
      await release();
    }
  } catch {
    // Session revocation failure must not block logout bookkeeping.
  }
  await writeAudit(c, {
    actorUserId: u?.id ?? null,
    action: "auth.logout",
    entityType: "session",
  });
  return c.json({ success: true });
});

// Removed password endpoints. Paths are reserved with 410 (not 404) so
// stale clients can distinguish intentional removal from unknown routes.
authApp.post("/signup", () => gone());
authApp.post("/login", () => gone());
authApp.post("/request-reset", () => gone());
authApp.post("/reset-password", () => gone());
authApp.post("/change-password", () => gone());

export default authApp;
