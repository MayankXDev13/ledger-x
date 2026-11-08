import { Hono } from "hono";
import { and, eq, isNull } from "drizzle-orm";
import { customers, transactions } from "../db/schema";
import { parseQuery, statementQuerySchema } from "../validators";
import { validationResponse, ApiError } from "../lib/errors";
import type { AppEnv } from "../types/hono";

const statementsApp = new Hono<AppEnv>();

function signedAmount(type: "credit" | "debit", amount: number): number {
  return type === "credit" ? amount : -amount;
}

// GET /statements/customers/:id?start&end - Statement model for one customer.
statementsApp.get("/customers/:id", async (ctx) => {
  const { id } = ctx.req.param();
  const { data: query, error } = parseQuery(
    ctx.req.query(),
    statementQuerySchema,
  );
  if (error) return validationResponse(ctx, error);

  const user = ctx.get("user");
  const { withDb } = ctx.get("deps");

  const result = await withDb(ctx, async (db) => {
    const [customer] = await db
      .select({ id: customers.id, name: customers.name, phone: customers.phone })
      .from(customers)
      .where(
        and(
          eq(customers.id, id),
          eq(customers.userId, user.id),
          isNull(customers.deletedAt),
        ),
      )
      .limit(1);

    if (!customer) throw new ApiError(404, "Customer not found");

    const rows = await db
      .select()
      .from(transactions)
      .where(
        and(
          eq(transactions.customerId, id),
          eq(transactions.userId, user.id),
          isNull(transactions.deletedAt),
        ),
      )
      .orderBy(transactions.createdAt);

    const ordered = [...rows].sort((a, b) => {
      const byDate = a.createdAt.getTime() - b.createdAt.getTime();
      return byDate !== 0 ? byDate : a.id.localeCompare(b.id);
    });

    const startDate = query.start ? new Date(query.start) : null;
    const endDate = query.end ? new Date(query.end) : null;

    let openingBalance = 0;
    let closingBalance = 0;
    let totalCredit = 0;
    let totalDebit = 0;
    const entries: {
      id: string;
      date: Date;
      type: "credit" | "debit";
      amount: number;
      paymentMethod: string | null;
      note: string | null;
      runningBalance: number;
    }[] = [];

    for (const row of ordered) {
      const signed = signedAmount(row.type, row.amount);

      if (startDate && row.createdAt < startDate) {
        openingBalance += signed;
        continue;
      }

      if (endDate && row.createdAt > endDate) continue;

      closingBalance += signed;
      if (row.type === "credit") totalCredit += row.amount;
      else totalDebit += row.amount;

      entries.push({
        id: row.id,
        date: row.createdAt,
        type: row.type,
        amount: row.amount,
        paymentMethod: row.paymentMethod ?? null,
        note: row.note ?? null,
        runningBalance: openingBalance + closingBalance,
      });
    }

    return {
      customer,
      start: query.start ?? null,
      end: query.end ?? null,
      openingBalance,
      closingBalance: openingBalance + closingBalance,
      totalCredit,
      totalDebit,
      entries,
    };
  });

  return ctx.json(result);
});

export default statementsApp;
