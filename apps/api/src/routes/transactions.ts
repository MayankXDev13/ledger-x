import { Hono } from "hono";
import {
  and,
  count,
  desc,
  eq,
  gte,
  isNull,
  lte,
  sql,
} from "drizzle-orm";
import { getTableColumns } from "drizzle-orm";
import {
  customers,
  transactions,
} from "../db/schema";
import type { Db } from "../db";
import type { AppEnv } from "../types/hono";
import {
  createTransactionSchema,
  parseBody,
  parseQuery,
  transactionListQuerySchema,
  updateTransactionSchema,
} from "../validators";
import {
  ApiError,
  isUniqueViolation,
  validationResponse,
} from "../lib/errors";

const transactionsApp = new Hono<AppEnv>();

function transactionNotFound() {
  return new ApiError(404, "Transaction not found");
}

async function findOwnedTransaction(db: Db, userId: string, id: string) {
  const [transaction] = await db
    .select({ id: transactions.id })
    .from(transactions)
    .where(
      and(
        eq(transactions.id, id),
        eq(transactions.userId, userId),
        isNull(transactions.deletedAt),
      ),
    )
    .limit(1);

  return transaction;
}

// GET /transactions/customers/:id/transactions
// List transactions for a customer with pagination, date filter, excludes soft-deleted
transactionsApp.get("/customers/:id/transactions", async (ctx) => {
  const { id } = ctx.req.param();
  const { data: query, error } = parseQuery(
    ctx.req.query(),
    transactionListQuerySchema,
  );
  if (error) return validationResponse(ctx, error);

  const user = ctx.get("user");
  const { withDb } = ctx.get("deps");
  const { page, pageSize, start, end } = query;
  const offset = (page - 1) * pageSize;

  // Signed amount: +amount for credit, −amount for debit. Powers the
  // running-balance window below.
  const signedAmount = sql<number>`CASE WHEN ${transactions.type} = 'credit' THEN ${transactions.amount} ELSE -${transactions.amount} END`;

  const result = await withDb(ctx, async (db) => {
    const filters = [
      eq(transactions.customerId, id),
      eq(transactions.userId, user.id),
      isNull(transactions.deletedAt),
    ];

    if (start) {
      filters.push(gte(transactions.createdAt, new Date(start)));
    }

    if (end) {
      filters.push(lte(transactions.createdAt, new Date(end)));
    }

    const [rows, [{ total }], [{ totalCredit, totalDebit }], [{ totalAmount }]] =
      await Promise.all([
        // Page rows (newest first). The running balance is a window over the
        // FULL filtered set in chronological order — window functions evaluate
        // before ORDER BY/LIMIT, so rows on page 2+ still carry their true
        // cumulative post-transaction balances. The id tiebreak keeps the
        // window order and the display order identical.
        db
          .select({
            ...getTableColumns(transactions),
            runningBalance: sql<number>`SUM(${signedAmount}) OVER (ORDER BY ${transactions.createdAt} ASC, ${transactions.id} ASC)`,
          })
          .from(transactions)
          .where(and(...filters))
          .orderBy(desc(transactions.createdAt), desc(transactions.id))
          .limit(pageSize)
          .offset(offset),

        db
          .select({
            total: count(),
          })
          .from(transactions)
          .where(and(...filters)),

        // Whole-customer aggregates over the same filters — no LIMIT/OFFSET,
        // so summary cards stay correct regardless of the requested page.
        db
          .select({
            totalCredit: sql<number>`COALESCE(SUM(CASE WHEN ${transactions.type} = 'credit' THEN ${transactions.amount} ELSE 0 END), 0)`,
            totalDebit: sql<number>`COALESCE(SUM(CASE WHEN ${transactions.type} = 'debit' THEN ${transactions.amount} ELSE 0 END), 0)`,
          })
          .from(transactions)
          .where(and(...filters)),

        db
          .select({
            totalAmount: sql<number>`COALESCE(SUM(${transactions.amount}), 0)`,
          })
          .from(transactions)
          .where(and(...filters)),
      ]);

    // node-postgres returns SUM(numeric) as a string — coerce so the JSON
    // contract stays numeric for every consumer.
    const toNumber = (value: unknown) => Number(value ?? 0);

    return {
      data: rows.map((row) => ({
        ...row,
        runningBalance: toNumber(row.runningBalance),
      })),
      page,
      pageSize,
      total,
      totalCredit: toNumber(totalCredit),
      totalDebit: toNumber(totalDebit),
      totalAmount: toNumber(totalAmount),
      start: start ?? null,
      end: end ?? null,
    };
  });

  return ctx.json(result);
});

// GET /transactions/:id - Get single transaction
transactionsApp.get("/:id", async (ctx) => {
  const { id } = ctx.req.param();
  const user = ctx.get("user");
  const { withDb } = ctx.get("deps");

  const data = await withDb(ctx, (db) =>
    db
      .select()
      .from(transactions)
      .where(
        and(
          eq(transactions.id, id),
          eq(transactions.userId, user.id),
          isNull(transactions.deletedAt),
        ),
      )
      .limit(1),
  );

  if (!data[0]) {
    throw transactionNotFound();
  }

  return ctx.json(data[0]);
});

// POST /transactions - Create transaction
transactionsApp.post("/", async (ctx) => {
  const { data: body, error } = await parseBody(
    ctx.req.raw,
    createTransactionSchema,
  );
  if (error) return validationResponse(ctx, error);

  const user = ctx.get("user");
  const { withDb } = ctx.get("deps");

  const created = await withDb(ctx, async (db) => {
    // Client-supplied id: a replay of an already-accepted write returns the
    // existing owned record instead of inserting a duplicate.
    if (body.id) {
      const [existing] = await db
        .select()
        .from(transactions)
        .where(
          and(
            eq(transactions.id, body.id),
            eq(transactions.userId, user.id),
          ),
        )
        .limit(1);

      if (existing) return existing;
    }

    const [customer] = await db
      .select({ id: customers.id, bookId: customers.bookId })
      .from(customers)
      .where(
        and(
          eq(customers.id, body.customerId),
          eq(customers.userId, user.id),
          isNull(customers.deletedAt),
        ),
      )
      .limit(1);

    if (!customer) throw new ApiError(404, "Customer not found");

    try {
      const [transaction] = await db
        .insert(transactions)
        .values({
          id: body.id,
          userId: user.id,
          bookId: customer.bookId,
          customerId: body.customerId,
          amount: body.amount,
          type: body.type,
          paymentMethod: body.paymentMethod ?? null,
          note: body.note,
        })
        .returning();

      return transaction;
    } catch (error) {
      // A concurrent or retried insert with the same client id: return the
      // winning owned row, otherwise hide the other user's record.
      if (body.id && isUniqueViolation(error)) {
        const [owned] = await db
          .select()
          .from(transactions)
          .where(
            and(
              eq(transactions.id, body.id),
              eq(transactions.userId, user.id),
            ),
          )
          .limit(1);

        if (owned) return owned;
        throw new ApiError(404, "Transaction not found");
      }

      throw error;
    }
  });

  return ctx.json(created, 201);
});

// PUT /transactions/:id - Update transaction
transactionsApp.put("/:id", async (ctx) => {
  const { id } = ctx.req.param();
  const { data: body, error } = await parseBody(
    ctx.req.raw,
    updateTransactionSchema,
  );
  if (error) return validationResponse(ctx, error);

  const user = ctx.get("user");
  const { withDb } = ctx.get("deps");

  const updated = await withDb(ctx, async (db) => {
    const [transaction] = await db
      .update(transactions)
      .set({ ...body, updatedAt: new Date() })
      .where(
        and(
          eq(transactions.id, id),
          eq(transactions.userId, user.id),
          isNull(transactions.deletedAt),
        ),
      )
      .returning();

    return transaction;
  });

  if (!updated) throw transactionNotFound();

  return ctx.json(updated);
});

// DELETE /transactions/:id - Soft delete
transactionsApp.delete("/:id", async (ctx) => {
  const { id } = ctx.req.param();
  const user = ctx.get("user");
  const { withDb } = ctx.get("deps");

  const deleted = await withDb(ctx, (db) =>
    db
      .update(transactions)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(
        and(
          eq(transactions.id, id),
          eq(transactions.userId, user.id),
          isNull(transactions.deletedAt),
        ),
      )
      .returning({ id: transactions.id }),
  );

  if (deleted.length === 0) throw transactionNotFound();

  return ctx.json({ success: true });
});

export default transactionsApp;
