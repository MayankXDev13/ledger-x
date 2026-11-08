import { Hono } from "hono";
import { and, eq } from "drizzle-orm";
import { customers, transactions } from "../db/schema";
import { ensureDefaultBook } from "../lib/books";
import { writeAudit } from "../lib/audit";
import type { AppEnv } from "../types/hono";

const sampleDataApp = new Hono<AppEnv>();

const SAMPLE_CUSTOMERS = [
  { name: "Sample — Ramesh Kirana", phone: "9000000001" },
  { name: "Sample — Sunita Tailors", phone: "9000000002" },
  { name: "Sample — Arjun Repairs", phone: "9000000003" },
];

// POST /sample-data - Seed clearly labeled demo customers and entries.
sampleDataApp.post("/", async (ctx) => {
  const user = ctx.get("user");
  const { withDb } = ctx.get("deps");

  const result = await withDb(ctx, async (db) => {
    const book = await ensureDefaultBook(db, user.id);

    const createdCustomers = await db
      .insert(customers)
      .values(
        SAMPLE_CUSTOMERS.map((customer) => ({
          userId: user.id,
          bookId: book.id,
          name: customer.name,
          phone: customer.phone,
          isSample: true,
        })),
      )
      .returning();

    const createdTransactions = createdCustomers.length
      ? await db
          .insert(transactions)
          .values(
            createdCustomers.flatMap((customer, index) => [
              {
                userId: user.id,
                bookId: book.id,
                customerId: customer.id,
                amount: 25000 + index * 15000,
                type: "credit" as const,
                isSample: true,
                note: "Sample credit",
              },
              {
                userId: user.id,
                bookId: book.id,
                customerId: customer.id,
                amount: 10000,
                type: "debit" as const,
                paymentMethod: "cash" as const,
                isSample: true,
                note: "Sample payment",
              },
            ]),
          )
          .returning()
      : [];

    return { customers: createdCustomers, transactions: createdTransactions };
  });

  await writeAudit(ctx, {
    actorUserId: user.id,
    action: "sample.create",
    entityType: "sample_data",
    entityId: user.id,
    metadata: { customers: result.customers.length },
  });

  return ctx.json(result, 201);
});

// DELETE /sample-data - Remove only the sample records; real data is untouched.
sampleDataApp.delete("/", async (ctx) => {
  const user = ctx.get("user");
  const { withDb } = ctx.get("deps");

  await withDb(ctx, async (db) => {
    await db
      .delete(transactions)
      .where(
        and(
          eq(transactions.userId, user.id),
          eq(transactions.isSample, true),
        ),
      );

    await db
      .delete(customers)
      .where(
        and(eq(customers.userId, user.id), eq(customers.isSample, true)),
      );
  });

  await writeAudit(ctx, {
    actorUserId: user.id,
    action: "sample.delete",
    entityType: "sample_data",
    entityId: user.id,
  });

  return ctx.json({ success: true });
});

export default sampleDataApp;
