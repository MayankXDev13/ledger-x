import { eq } from "drizzle-orm";
import { account, session, user } from "../db/schema";
import type { AppEnv, AuthUser, VerifyToken } from "../types/hono";

function randomToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

async function hashSecret(secret: string): Promise<string> {
  const data = new TextEncoder().encode(`ledgerx:${secret}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest), (b) =>
    b.toString(16).padStart(2, "0")
  ).join("");
}

export const verifyToken: VerifyToken = async (ctx, token) => {
  const { withDb } = ctx.get("deps");
  try {
    const rows = await withDb(ctx, (db) =>
      db
        .select({ token: session.token, expiresAt: session.expiresAt, id: user.id, email: user.email })
        .from(session)
        .innerJoin(user, eq(session.userId, user.id))
        .where(eq(session.token, token))
        .limit(1)
    );
    const row = rows[0] as unknown as
      | { token: string; expiresAt: Date; id: string; email: string }
      | undefined;
    if (!row) return null;
    if (row.expiresAt && new Date(row.expiresAt).getTime() < Date.now()) return null;
    return { id: row.id, email: row.email } as AuthUser;
  } catch {
    return null;
  }
};

export async function createUserWithPassword(
  ctx: { get: (k: "deps") => AppEnv["Variables"]["deps"] } & Parameters<VerifyToken>[0],
  email: string,
  password: string
) {
  const { withDb } = ctx.get("deps");
  const id = crypto.randomUUID();
  const passwordHash = await hashSecret(password);
  return withDb(ctx as never, async (db) => {
    const [u] = await db.insert(user).values({ id, name: email.split("@")[0], email }).returning();
    await db.insert(account).values({
      id: crypto.randomUUID(),
      userId: id,
      accountId: email,
      providerId: "credential",
      password: passwordHash,
    });
    return u;
  });
}

export async function verifyPasswordHash(
  stored: string,
  password: string
): Promise<boolean> {
  return stored === (await hashSecret(password));
}

export async function createSession(
  ctx: Parameters<VerifyToken>[0],
  userId: string
): Promise<string> {
  const { withDb } = ctx.get("deps");
  const token = randomToken();
  const expiresAt = new Date(Date.now() + 7 * 24 * 3600 * 1000);
  await withDb(ctx, (db) =>
    db.insert(session).values({ id: crypto.randomUUID(), userId, token, expiresAt })
  );
  return token;
}

export { randomToken };
