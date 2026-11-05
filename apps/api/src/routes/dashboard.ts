import { Hono } from "hono";
import { and, desc, eq, gte, isNull, sql } from "drizzle-orm";
import { customers, transactions } from "../db/schema";
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

export default dashboardApp;
