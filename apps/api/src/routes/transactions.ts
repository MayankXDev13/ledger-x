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
import {
  customers,
  transactionTagMap,
  transactionTags,
  transactions,
} from "../db/schema";
import type { Db } from "../db";
import type { AppEnv } from "../types/hono";
import {
  addTagToTransactionSchema,
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

    const [data, [{ total }], [{ totalAmount }]] = await Promise.all([
      db
        .select()
        .from(transactions)
        .where(and(...filters))
        .orderBy(desc(transactions.createdAt))
        .limit(pageSize)
        .offset(offset),

      db
        .select({
          total: count(),
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

    return {
      data,
      page,
      pageSize,
      total,
      totalAmount,
      start: start ?? null,
      end: end ?? null,
    };
  });

  return ctx.json(result);
});

// ── Tags on a Transaction ─────────────────────────────────────────────────────

// GET /transactions/:id/tags
transactionsApp.get("/:id/tags", async (ctx) => {
  const { id } = ctx.req.param();
  const user = ctx.get("user");
  const { withDb } = ctx.get("deps");

  const data = await withDb(ctx, async (db) => {
    const transaction = await findOwnedTransaction(db, user.id, id);
    if (!transaction) throw transactionNotFound();

    const rows = await db
      .select({ tag: transactionTags })
      .from(transactionTagMap)
      .innerJoin(
        transactionTags,
        eq(transactionTagMap.tagId, transactionTags.id),
      )
      .where(
        and(
          eq(transactionTagMap.transactionId, id),
          eq(transactionTags.userId, user.id),
        ),
      );

    return rows.map((row) => row.tag);
  });

  return ctx.json(data);
});

// POST /transactions/:id/tags
transactionsApp.post("/:id/tags", async (ctx) => {
  const { id } = ctx.req.param();
  const { data: body, error } = await parseBody(
    ctx.req.raw,
    addTagToTransactionSchema,
  );
  if (error) return validationResponse(ctx, error);

  const user = ctx.get("user");
  const { withDb } = ctx.get("deps");

  try {
    await withDb(ctx, async (db) => {
      const transaction = await findOwnedTransaction(db, user.id, id);
      if (!transaction) throw transactionNotFound();

      const [tag] = await db
        .select({ id: transactionTags.id })
        .from(transactionTags)
        .where(
          and(
            eq(transactionTags.id, body.tag_id),
            eq(transactionTags.userId, user.id),
          ),
        )
        .limit(1);

      if (!tag) throw new ApiError(404, "Tag not found");

      await db.insert(transactionTagMap).values({
        transactionId: id,
        tagId: body.tag_id,
      });
    });
  } catch (err) {
    if (isUniqueViolation(err)) {
      throw new ApiError(409, "Tag already added to transaction");
    }
    throw err;
  }

  return ctx.json({ success: true }, 201);
});

// DELETE /transactions/:id/tags/:tagId
transactionsApp.delete("/:id/tags/:tagId", async (ctx) => {
  const { id, tagId } = ctx.req.param();
  const user = ctx.get("user");
  const { withDb } = ctx.get("deps");

  await withDb(ctx, async (db) => {
    const transaction = await findOwnedTransaction(db, user.id, id);
    if (!transaction) throw transactionNotFound();

    const [tag] = await db
      .select({ id: transactionTags.id })
      .from(transactionTags)
      .where(
        and(
          eq(transactionTags.id, tagId),
          eq(transactionTags.userId, user.id),
        ),
      )
      .limit(1);

    if (!tag) throw new ApiError(404, "Tag not found");

    await db
      .delete(transactionTagMap)
      .where(
        and(
          eq(transactionTagMap.transactionId, id),
          eq(transactionTagMap.tagId, tagId),
        ),
      );
  });

  return ctx.json({ success: true });
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
    const [customer] = await db
      .select({ id: customers.id })
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

    const [transaction] = await db
      .insert(transactions)
      .values({
        userId: user.id,
        customerId: body.customerId,
        amount: body.amount,
        type: body.type,
        note: body.note,
      })
      .returning();

    return transaction;
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
