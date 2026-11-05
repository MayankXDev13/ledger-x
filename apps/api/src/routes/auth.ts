import { Hono } from "hono";
import { and, eq, ne } from "drizzle-orm";
import { account, session, user, verification } from "../db/schema";
import type { AppEnv } from "../types/hono";
import { parseBody } from "../validators";
import { ApiError, validationResponse } from "../lib/errors";
import { writeAudit } from "../lib/audit";
import {
  createSession,
  verifyPasswordHash,
} from "../lib/auth";
import {
  changePasswordSchema,
  loginSchema,
  requestResetSchema,
  resetPasswordSchema,
  signupSchema,
} from "../validators";

const authApp = new Hono<AppEnv>();

authApp.get("/me", async (c) => {
  const u = c.get("user");
  if (!u) return c.json({ error: "Unauthenticated" }, 401);
  return c.json({ id: u.id, email: u.email });
});

authApp.post("/signup", async (c) => {
  const { data: body, error } = await parseBody(c.req.raw, signupSchema);
  if (error) return validationResponse(c, error);
  const { withDb } = c.get("deps");
  try {
    const created = await withDb(c, async (db) => {
      const [existing] = await db
        .select({ id: user.id })
        .from(user)
        .where(eq(user.email, body.email))
        .limit(1);
      if (existing) throw new ApiError(409, "Email already registered");
      const id = crypto.randomUUID();
      const data = new TextEncoder().encode(`ledgerx:${body.password}`);
      const digest = await crypto.subtle.digest("SHA-256", data);
      const passwordHash = Array.from(new Uint8Array(digest), (b) =>
        b.toString(16).padStart(2, "0")
      ).join("");
      const [u] = await db
        .insert(user)
        .values({ id, name: body.email.split("@")[0], email: body.email })
        .returning();
      await db.insert(account).values({
        id: crypto.randomUUID(),
        userId: id,
        accountId: body.email,
        providerId: "credential",
        password: passwordHash,
      });
      return u;
    });
    const token = await createSession(c, created.id);
    await writeAudit(c, {
      actorUserId: created.id,
      action: "auth.signup",
      entityType: "user",
      entityId: created.id,
    });
    return c.json({ id: created.id, email: created.email, token }, 201);
  } catch (e) {
    if (e instanceof ApiError) throw e;
    throw new ApiError(500, "Internal server error");
  }
});

authApp.post("/login", async (c) => {
  const { data: body, error } = await parseBody(c.req.raw, loginSchema);
  if (error) return validationResponse(c, error);
  const { withDb } = c.get("deps");
  const found = await withDb(c, async (db) => {
    const [u] = await db
      .select()
      .from(user)
      .where(eq(user.email, body.email))
      .limit(1);
    if (!u) return null;
    const [acc] = await db
      .select()
      .from(account)
      .where(eq(account.userId, u.id))
      .limit(1);
    return { u, acc };
  });
  if (!found || !found.acc?.password) {
    await writeAudit(c, {
      action: "auth.login_failed",
      entityType: "user",
      metadata: { email: body.email },
    });
    throw new ApiError(401, "Invalid email or password");
  }
  const ok = await verifyPasswordHash(found.acc.password, body.password);
  if (!ok) {
    await writeAudit(c, {
      actorUserId: found.u.id,
      action: "auth.login_failed",
      entityType: "user",
      entityId: found.u.id,
    });
    throw new ApiError(401, "Invalid email or password");
  }
  const token = await createSession(c, found.u.id);
  await writeAudit(c, {
    actorUserId: found.u.id,
    action: "auth.login",
    entityType: "user",
    entityId: found.u.id,
  });
  return c.json({ id: found.u.id, email: found.u.email, token });
});

authApp.post("/logout", async (c) => {
  const u = c.get("user");
  const header = c.req.header("Authorization");
  const token = header?.match(/^Bearer\s+(.+)$/i)?.[1];
  const { withDb } = c.get("deps");
  if (token) {
    await withDb(c, (db) => db.delete(session).where(eq(session.token, token)));
  }
  await writeAudit(c, {
    actorUserId: u?.id ?? null,
    action: "auth.logout",
    entityType: "session",
  });
  return c.json({ success: true });
});

authApp.post("/change-password", async (c) => {
  const u = c.get("user");
  const { data: body, error } = await parseBody(c.req.raw, changePasswordSchema);
  if (error) return validationResponse(c, error);
  const { withDb } = c.get("deps");
  const [acc] = await withDb(c, (db) =>
    db.select().from(account).where(eq(account.userId, u.id)).limit(1)
  );
  if (!acc?.password || !(await verifyPasswordHash(acc.password, body.currentPassword))) {
    throw new ApiError(401, "Current password is incorrect");
  }
  const data = new TextEncoder().encode(`ledgerx:${body.newPassword}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  const passwordHash = Array.from(new Uint8Array(digest), (b) =>
    b.toString(16).padStart(2, "0")
  ).join("");
  const header = c.req.header("Authorization");
  const currentToken = header?.match(/^Bearer\s+(.+)$/i)?.[1];
  await withDb(c, async (db) => {
    await db.update(account).set({ password: passwordHash }).where(eq(account.id, acc.id));
    if (currentToken) {
      await db
        .delete(session)
        .where(and(eq(session.userId, u.id), ne(session.token, currentToken)));
    } else {
      await db.delete(session).where(eq(session.userId, u.id));
    }
  });
  await writeAudit(c, {
    actorUserId: u.id,
    action: "auth.password_reset",
    entityType: "user",
    entityId: u.id,
    metadata: { via: "change-password" },
  });
  return c.json({ success: true });
});

authApp.post("/request-reset", async (c) => {
  const { data: body, error } = await parseBody(c.req.raw, requestResetSchema);
  if (error) return validationResponse(c, error);
  const { withDb } = c.get("deps");
  const [u] = await withDb(c, (db) =>
    db.select().from(user).where(eq(user.email, body.email)).limit(1)
  );
  // Always respond success to avoid email enumeration.
  if (u) {
    const token = crypto.randomUUID();
    await withDb(c, (db) =>
      db.insert(verification).values({
        id: crypto.randomUUID(),
        identifier: `password-reset:${u.id}`,
        value: token,
        expiresAt: new Date(Date.now() + 3600 * 1000),
      })
    );
    await writeAudit(c, {
      actorUserId: u.id,
      action: "auth.password_reset_request",
      entityType: "user",
      entityId: u.id,
    });
  }
  return c.json({ success: true });
});

authApp.post("/reset-password", async (c) => {
  const { data: body, error } = await parseBody(c.req.raw, resetPasswordSchema);
  if (error) return validationResponse(c, error);
  const { withDb } = c.get("deps");
  const [u] = await withDb(c, (db) =>
    db.select().from(user).where(eq(user.email, body.email)).limit(1)
  );
  if (!u) throw new ApiError(400, "Invalid reset token");
  const rows = await withDb(c, (db) =>
    db.select().from(verification).where(eq(verification.identifier, `password-reset:${u.id}`))
  );
  const match = rows.find((r) => r.value === body.token);
  if (!match || new Date(match.expiresAt).getTime() < Date.now()) {
    throw new ApiError(400, "Invalid reset token");
  }
  const data = new TextEncoder().encode(`ledgerx:${body.newPassword}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  const passwordHash = Array.from(new Uint8Array(digest), (b) =>
    b.toString(16).padStart(2, "0")
  ).join("");
  await withDb(c, async (db) => {
    await db.delete(verification).where(eq(verification.id, match.id));
    await db.delete(session).where(eq(session.userId, u.id));
    const [acc] = await db.select().from(account).where(eq(account.userId, u.id)).limit(1);
    if (acc) {
      await db.update(account).set({ password: passwordHash }).where(eq(account.id, acc.id));
    } else {
      await db.insert(account).values({
        id: crypto.randomUUID(),
        userId: u.id,
        accountId: u.email,
        providerId: "credential",
        password: passwordHash,
      });
    }
  });
  await writeAudit(c, {
    actorUserId: u.id,
    action: "auth.password_reset",
    entityType: "user",
    entityId: u.id,
  });
  return c.json({ success: true });
});

export default authApp;
