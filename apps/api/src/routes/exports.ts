import { Hono } from "hono";
import { and, eq, isNull } from "drizzle-orm";
import { customers, transactions } from "../db/schema";
import {
  csvResponse,
  formatAmount,
  isExportable,
  toCsv,
} from "../lib/csv";
import { writeAudit } from "../lib/audit";
import type { AppEnv } from "../types/hono";

const exportsApp = new Hono<AppEnv>();

function fileDate(now = new Date()): string {
  return now.toISOString().slice(0, 10);
}

// GET /exports/customers.csv - Non-deleted, non-sample customers as CSV.
exportsApp.get("/customers.csv", async (ctx) => {
  const user = ctx.get("user");
  const { withDb } = ctx.get("deps");

  const rows = (await withDb(ctx, (db) =>
    db
      .select()
      .from(customers)
      .where(
        and(
          eq(customers.userId, user.id),
          isNull(customers.deletedAt),
          eq(customers.isSample, false),
        ),
      ),
  )).filter((row) => isExportable(row));

  await writeAudit(ctx, {
    actorUserId: user.id,
    action: "account.export",
    entityType: "account",
    entityId: user.id,
    metadata: { kind: "customers.csv" },
  });

  const csv = toCsv(
    ["id", "name", "phone", "created_at", "updated_at"],
    rows.map((customer) => [
      customer.id,
      customer.name,
      customer.phone,
      customer.createdAt,
      customer.updatedAt,
    ]),
  );

  return csvResponse(`ledger-x-customers-${fileDate()}.csv`, csv);
});

// GET /exports/transactions.csv - Non-deleted, non-sample transactions as CSV.
exportsApp.get("/transactions.csv", async (ctx) => {
  const user = ctx.get("user");
  const { withDb } = ctx.get("deps");

  const [txRows, customerRows] = await withDb(ctx, async (db) => {
    const txRows = (
      await db
        .select()
        .from(transactions)
        .where(
          and(
            eq(transactions.userId, user.id),
            isNull(transactions.deletedAt),
            eq(transactions.isSample, false),
          ),
        )
    ).filter((row) => isExportable(row));

    const customerRows = await db
      .select({ id: customers.id, name: customers.name })
      .from(customers)
      .where(eq(customers.userId, user.id));

    return [txRows, customerRows] as const;
  });

  const customerNames = new Map(
    customerRows.map((customer) => [customer.id, customer.name]),
  );

  await writeAudit(ctx, {
    actorUserId: user.id,
    action: "account.export",
    entityType: "account",
    entityId: user.id,
    metadata: { kind: "transactions.csv" },
  });

  const csv = toCsv(
    [
      "id",
      "customer_id",
      "customer_name",
      "type",
      "amount",
      "payment_method",
      "note",
      "created_at",
      "updated_at",
    ],
    txRows.map((transaction) => [
      transaction.id,
      transaction.customerId,
      customerNames.get(transaction.customerId) ?? "",
      transaction.type,
      formatAmount(transaction.amount),
      transaction.paymentMethod ?? "",
      transaction.note ?? "",
      transaction.createdAt,
      transaction.updatedAt,
    ]),
  );

  return csvResponse(`ledger-x-transactions-${fileDate()}.csv`, csv);
});

export default exportsApp;
