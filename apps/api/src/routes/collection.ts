import { Hono } from "hono";
import { and, eq, isNull } from "drizzle-orm";
import { customers, transactions } from "../db/schema";
import { computeReceivables } from "../lib/receivables";
import { parseQuery, collectionQuerySchema } from "../validators";
import { validationResponse } from "../lib/errors";
import type { AppEnv } from "../types/hono";

const collectionApp = new Hono<AppEnv>();

// GET /collection?sort=amount|age - Customers with a positive outstanding balance.
collectionApp.get("/", async (ctx) => {
  const { data: query, error } = parseQuery(
    ctx.req.query(),
    collectionQuerySchema,
  );
  if (error) return validationResponse(ctx, error);

  const user = ctx.get("user");
  const { withDb } = ctx.get("deps");

  const [customerRows, entryRows] = await withDb(ctx, async (db) => {
    const customerRows = await db
      .select({ id: customers.id, name: customers.name, phone: customers.phone })
      .from(customers)
      .where(
        and(eq(customers.userId, user.id), isNull(customers.deletedAt)),
      );

    const entryRows = await db
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

    return [customerRows, entryRows] as const;
  });

  const receivables = computeReceivables(entryRows);

  const data = customerRows
    .map((customer) => {
      const receivable = receivables.get(customer.id);
      return {
        customerId: customer.id,
        name: customer.name,
        phone: customer.phone,
        outstanding: receivable?.balance ?? 0,
        oldestUnpaidCreditAt: receivable?.oldestUnpaidCreditAt ?? null,
        ageDays: receivable?.ageDays ?? null,
      };
    })
    .filter((row) => row.outstanding > 0);

  if (query.sort === "age") {
    data.sort((a, b) => (b.ageDays ?? 0) - (a.ageDays ?? 0));
  } else {
    data.sort((a, b) => b.outstanding - a.outstanding);
  }

  const totalReceivables = data.reduce((sum, row) => sum + row.outstanding, 0);

  return ctx.json({ data, totalReceivables, sort: query.sort });
});

export default collectionApp;
