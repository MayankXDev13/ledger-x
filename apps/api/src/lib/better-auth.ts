import { betterAuth } from "better-auth";
import { expo } from "@better-auth/expo";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { bearer } from "better-auth/plugins";
import { drizzle } from "drizzle-orm/node-postgres";
import { Client as PgClient } from "pg";
import * as schema from "../db/schema";
import { auditLogs } from "../db/schema";
import type { Bindings } from "../types/hono";

/**
 * Per-request Better Auth factory. The instance cannot live at module scope:
 * Workers have no `process.env` secrets there and every database connection
 * must be scoped to the request's Hyperdrive binding (see `createWithDb`).
 *
 * Google is the sole sign-in method. First sign-in with a verified Google
 * email matching an existing `user` row links to that same `user.id`
 * (implicit linking over `trustedProviders`), so the one migrated password
 * user keeps their data. `emailAndPassword` is disabled entirely.
 */
export function getAuth(env: Bindings) {
  const missing = [
    ["GOOGLE_CLIENT_ID", env.GOOGLE_CLIENT_ID],
    ["GOOGLE_CLIENT_SECRET", env.GOOGLE_CLIENT_SECRET],
    ["BETTER_AUTH_SECRET", env.BETTER_AUTH_SECRET],
  ]
    .filter(([, value]) => !value)
    .map(([name]) => name);

  if (missing.length > 0) {
    throw new Error(
      `Auth is not configured: missing ${missing.join(", ")}. ` +
        `Set them as Worker secrets/vars (see docs/auth-migration.md).`,
    );
  }

  const client = new PgClient({
    connectionString: env.HYPERDRIVE.connectionString,
  });
  const db = drizzle(client, { schema });

  // Audit writes must never break authentication.
  async function audit(entry: {
    actorUserId?: string | null;
    action: string;
    entityType: string;
    entityId?: string | null;
  }) {
    try {
      await db.insert(auditLogs).values({
        actorUserId: entry.actorUserId ?? null,
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId ?? null,
      });
    } catch {
      // ignore
    }
  }

  const auth = betterAuth({
    baseURL: env.BETTER_AUTH_URL || "http://localhost:8787",
    secret: env.BETTER_AUTH_SECRET,
    database: drizzleAdapter(db, { provider: "pg", schema }),
    emailAndPassword: { enabled: false },
    socialProviders: {
      google: {
        clientId: env.GOOGLE_CLIENT_ID!,
        clientSecret: env.GOOGLE_CLIENT_SECRET!,
        overrideUserInfo: true,
      },
    },
    account: {
      accountLinking: {
        enabled: true,
        trustedProviders: ["google"],
        updateUserInfoOnLink: true,
      },
    },
    session: { expiresIn: 60 * 60 * 24 * 7, updateAge: 60 * 60 * 24 },
    plugins: [expo(), bearer()],
    databaseHooks: {
      user: {
        create: {
          after: async (user) => {
            await audit({
              actorUserId: user.id,
              action: "auth.signup",
              entityType: "user",
              entityId: user.id,
            });
          },
        },
      },
      session: {
        create: {
          after: async (session) => {
            await audit({
              actorUserId: session.userId,
              action: "auth.login",
              entityType: "session",
              entityId: session.id,
            });
          },
        },
        delete: {
          after: async (session) => {
            await audit({
              actorUserId: session.userId,
              action: "auth.logout",
              entityType: "session",
              entityId: session.id,
            });
          },
        },
      },
    },
    trustedOrigins:
      env.TRUSTED_ORIGINS?.split(",")
        .map((origin) => origin.trim())
        .filter(Boolean) ?? [],
  });

  return {
    auth,
    async release() {
      await client.end().catch(() => undefined);
    },
    async connect() {
      await client.connect();
    },
  };
}

export type AuthInstance = ReturnType<typeof getAuth>["auth"];
