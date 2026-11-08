import { Hono } from "hono";
import { and, desc, eq, gte, isNull, sql } from "drizzle-orm";
import { customers, transactions } from "../db/schema";
import { agingBuckets, computeReceivables } from "../lib/receivables";
import type { AppEnv } from "../types/hono";

const dashboardApp = new Hono<AppEnv>();

// GET /dashboard/metrics
dashboardApp.get("/metrics", async (ctx) => {
  const user = ctx.get("user");
  const { withDb } = ctx.get("deps");

  const metrics = await withDb(ctx, async (db) => {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [customerResult, balanceResult, monthlyResult] = await Promise.all([
      db
        .select({
          count: sql<number>`count(*)`,
        })
        .from(customers)
        .where(
          and(eq(customers.userId, user.id), isNull(customers.deletedAt)),
        ),

      db
        .select({
          totalCredit: sql<number>`
            coalesce(
              sum(
                case
                  when ${transactions.type} = 'credit'
                  then ${transactions.amount}
                  else 0
                end
              ),
              0
            )
          `,
          totalDebit: sql<number>`
            coalesce(
              sum(
                case
                  when ${transactions.type} = 'debit'
                  then ${transactions.amount}
                  else 0
                end
              ),
              0
            )
          `,
        })
        .from(transactions)
        .where(
          and(
            eq(transactions.userId, user.id),
            isNull(transactions.deletedAt),
          ),
        ),

      db
        .select({
          monthCredit: sql<number>`
            coalesce(
              sum(
                case
                  when ${transactions.type} = 'credit'
                  then ${transactions.amount}
                  else 0
                end
              ),
              0
            )
          `,
          monthDebit: sql<number>`
            coalesce(
              sum(
                case
                  when ${transactions.type} = 'debit'
                  then ${transactions.amount}
                  else 0
                end
              ),
              0
            )
          `,
        })
        .from(transactions)
        .where(
          and(
            eq(transactions.userId, user.id),
            isNull(transactions.deletedAt),
            gte(transactions.createdAt, startOfMonth),
          ),
        ),
    ]);

    const totalCustomers = Number(customerResult[0]?.count ?? 0);
    const totalBalance =
      Number(balanceResult[0]?.totalCredit ?? 0) -
      Number(balanceResult[0]?.totalDebit ?? 0);
    const monthlyNet =
      Number(monthlyResult[0]?.monthCredit ?? 0) -
      Number(monthlyResult[0]?.monthDebit ?? 0);

    return { totalBalance, totalCustomers, monthlyNet };
  });

  return ctx.json(metrics);
});

// GET /dashboard/recent-transactions
dashboardApp.get("/recent-transactions", async (ctx) => {
  const user = ctx.get("user");
  const { withDb } = ctx.get("deps");

  const data = await withDb(ctx, (db) =>
    db
      .select()
      .from(transactions)
      .where(
        and(
          eq(transactions.userId, user.id),
          isNull(transactions.deletedAt),
        ),
      )
      .orderBy(desc(transactions.createdAt))
      .limit(5),
  );

  return ctx.json(data);
});

const TOP_DEBTORS_LIMIT = 10;

function monthKey(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

// GET /dashboard/analytics
// Twelve-month credit/debit trend, top debtors, and receivables aging.
dashboardApp.get("/analytics", async (ctx) => {
  const user = ctx.get("user");
  const { withDb } = ctx.get("deps");

  const [customerRows, entries] = await withDb(ctx, async (db) => {
    const customerRows = await db
      .select({ id: customers.id, name: customers.name })
      .from(customers)
      .where(
        and(eq(customers.userId, user.id), isNull(customers.deletedAt)),
      );

    const entries = await db
      .select({
        customerId: transactions.customerId,
        amount: transactions.amount,
        type: transactions.type,
        createdAt: transactions.createdAt,
      })
      .from(transactions)
      .where(
        and(eq(transactions.userId, user.id), isNull(transactions.deletedAt)),
      );

    return [customerRows, entries] as const;
  });

  const now = new Date();
  const keys: string[] = [];
  for (let offset = 11; offset >= 0; offset -= 1) {
    keys.push(
      monthKey(
        new Date(
          Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - offset, 1),
        ),
      ),
    );
  }

  const trend = keys.map((month) => ({ month, credit: 0, debit: 0 }));
  const monthIndex = new Map(keys.map((key, index) => [key, index]));

  for (const entry of entries) {
    const index = monthIndex.get(monthKey(new Date(entry.createdAt)));
    if (index === undefined) continue;

    if (entry.type === "credit") trend[index].credit += entry.amount;
    else trend[index].debit += entry.amount;
  }

  const receivables = computeReceivables(entries);
  const names = new Map(customerRows.map((row) => [row.id, row.name]));

  const topDebtors = [...receivables.values()]
    .filter((receivable) => receivable.balance > 0)
    .sort((a, b) => b.balance - a.balance)
    .slice(0, TOP_DEBTORS_LIMIT)
    .map((receivable) => ({
      customerId: receivable.customerId,
      name: names.get(receivable.customerId) ?? "Unknown customer",
      outstanding: receivable.balance,
      ageDays: receivable.ageDays,
    }));

  const buckets = agingBuckets(receivables.values());
  const totalReceivables = [...receivables.values()]
    .filter((receivable) => receivable.balance > 0)
    .reduce((sum, receivable) => sum + receivable.balance, 0);

  return ctx.json({
    trend,
    topDebtors,
    aging: buckets,
    totalReceivables,
  });
});

export default dashboardApp;
