import { auditLogs } from "../db/schema";
import type { AppEnv } from "../types/hono";
import type { Context } from "hono";

export type AuditAction =
  | "auth.signup"
  | "auth.login"
  | "auth.login_failed"
  | "auth.logout"
  | "auth.password_reset_request"
  | "auth.password_reset"
  | "customer.create"
  | "customer.update"
  | "customer.delete"
  | "transaction.create"
  | "transaction.update"
  | "transaction.delete"
  | "tag.create"
  | "tag.update"
  | "tag.delete"
  | "tag.associate"
  | "tag.dissociate";

export async function writeAudit(
  ctx: Context<AppEnv>,
  entry: {
    actorUserId?: string | null;
    action: AuditAction | string;
    entityType: string;
    entityId?: string | null;
    metadata?: Record<string, unknown>;
  }
) {
  try {
    const { withDb } = ctx.get("deps");
    await withDb(ctx, (db) =>
      db.insert(auditLogs).values({
        actorUserId: entry.actorUserId ?? null,
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId ?? null,
        metadata: entry.metadata ?? null,
        ipAddress: ctx.req.header("x-forwarded-for") ?? ctx.req.header("cf-connecting-ip") ?? null,
        userAgent: ctx.req.header("user-agent") ?? null,
      })
    );
  } catch {
    // Audit writes must never break the main request.
  }
}
