import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { customers, transactions, user } from "../db/schema";
import { writeAudit } from "../lib/audit";
import { isExportable } from "../lib/csv";
import { parseBody, deleteAccountSchema } from "../validators";
import { ApiError, validationResponse } from "../lib/errors";
import { isEnabled, readFeatureFlags } from "../lib/feature-flags";
import type { AppEnv } from "../types/hono";

const accountApp = new Hono<AppEnv>();

// GET /account/export - Complete owned data archive, including soft-deleted rows.
accountApp.get("/export", async (ctx) => {
  const currentUser = ctx.get("user");
  const { withDb } = ctx.get("deps");

  const [customerRows, transactionRows] = await withDb(ctx, async (db) => {
    const customerRows = await db
      .select()
      .from(customers)
      .where(eq(customers.userId, currentUser.id));

    const transactionRows = await db
      .select()
      .from(transactions)
      .where(eq(transactions.userId, currentUser.id));

    return [customerRows, transactionRows] as const;
  });

  await writeAudit(ctx, {
    actorUserId: currentUser.id,
    action: "account.export",
    entityType: "account",
    entityId: currentUser.id,
    metadata: { kind: "account-archive" },
  });

  return ctx.json({
    exportedAt: new Date().toISOString(),
    user: { id: currentUser.id, email: currentUser.email },
    customers: customerRows
      .filter((row) => isExportable(row, { includeDeleted: true }))
      .map((row) => ({
        ...row,
        deleted: row.deletedAt !== null,
      })),
    transactions: transactionRows
      .filter((row) => isExportable(row, { includeDeleted: true }))
      .map((row) => ({
        ...row,
        deleted: row.deletedAt !== null,
      })),
  });
});

// DELETE /account - Irreversibly remove the account and its data.
accountApp.delete("/", async (ctx) => {
  const currentUser = ctx.get("user");
  const { withDb } = ctx.get("deps");

  const flags = await withDb(ctx, (db) => readFeatureFlags(db));
  if (!isEnabled(flags, "account_deletion")) {
    throw new ApiError(403, "Account deletion is disabled");
  }

  const { error } = await parseBody(ctx.req.raw, deleteAccountSchema);
  if (error) return validationResponse(ctx, error);

  // Append the request marker before the row disappears. audit_logs has no
  // foreign key on the actor, so the entry survives the cascade.
  await writeAudit(ctx, {
    actorUserId: currentUser.id,
    action: "account.delete",
    entityType: "account",
    entityId: currentUser.id,
    metadata: { outcome: "requested" },
  });

  try {
    await withDb(ctx, (db) =>
      db.delete(user).where(eq(user.id, currentUser.id)).returning({ id: user.id }),
    );
  } catch (error) {
    await writeAudit(ctx, {
      actorUserId: currentUser.id,
      action: "account.delete_failed",
      entityType: "account",
      entityId: currentUser.id,
      metadata: { outcome: "failed" },
    });
    throw error;
  }

  return ctx.json({ success: true });
});

export default accountApp;
