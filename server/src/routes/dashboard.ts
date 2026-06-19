import { Hono } from "hono";
import { eq, isNull, and, gte, desc } from "drizzle-orm";
import { getDb } from "../db";
import { customers, transactions } from "../db/schema";
import type { AppEnv } from "../types/hono";

const dashboardApp = new Hono<AppEnv>();

// GET /dashboard/metrics
dashboardApp.get("/metrics", async (c) => {
  const user = c.get("user");
  const db = getDb(c);

  // Total active customers
  const allCustomers = await db
    .select()
    .from(customers)
    .where(and(eq(customers.userId, user.id), isNull(customers.deletedAt)));

  const totalCustomers = allCustomers.length;

  // Total credit
  const creditTransactions = await db
    .select({ amount: transactions.amount })
    .from(transactions)
    .where(
      and(
        eq(transactions.userId, user.id),
        eq(transactions.type, "credit"),
        isNull(transactions.deletedAt),
      ),
    );

  const totalCredit = creditTransactions.reduce(
    (sum, transaction) => sum + transaction.amount,
    0,
  );

  // Total debit
  const debitTransactions = await db
    .select({ amount: transactions.amount })
    .from(transactions)
    .where(
      and(
        eq(transactions.userId, user.id),
        eq(transactions.type, "debit"),
        isNull(transactions.deletedAt),
      ),
    );

  const totalDebit = debitTransactions.reduce(
    (sum, transaction) => sum + transaction.amount,
    0,
  );

  const totalBalance = totalCredit - totalDebit;

  // Monthly net (current month credits - debits)
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const monthCredits = await db
    .select({ amount: transactions.amount })
    .from(transactions)
    .where(
      and(
        eq(transactions.userId, user.id),
        eq(transactions.type, "credit"),
        isNull(transactions.deletedAt),
        gte(transactions.createdAt, startOfMonth),
      ),
    );

  const monthDebits = await db
    .select({ amount: transactions.amount })
    .from(transactions)
    .where(
      and(
        eq(transactions.userId, user.id),
        eq(transactions.type, "debit"),
        isNull(transactions.deletedAt),
        gte(transactions.createdAt, startOfMonth),
      ),
    );

  const monthlyNet =
    monthCredits.reduce((sum, transaction) => sum + transaction.amount, 0) -
    monthDebits.reduce((sum, transaction) => sum + transaction.amount, 0);

  return c.json({
    totalBalance,
    totalCustomers,
    monthlyNet,
  });
});

// GET /dashboard/recent-transactions
dashboardApp.get("/recent-transactions", async (c) => {
  const user = c.get("user");
  const db = getDb(c);

  const data = await db
    .select()
    .from(transactions)
    .where(
      and(eq(transactions.userId, user.id), isNull(transactions.deletedAt)),
    )
    .orderBy(desc(transactions.createdAt))
    .limit(5);

  return c.json(data);
});

export default dashboardApp;
