import { Hono } from "hono";
import { eq, isNull, and, gte, lte, desc } from "drizzle-orm";
import { getDb } from "../db";
import { transactions, transactionTags, transactionTagMap } from "../db/schema";
import { generateId } from "../lib/id";
import type { AppEnv } from "../types/hono";

const transactionsApp = new Hono<AppEnv>();

// GET /transactions/customers/:id/transactions
// List transactions for a customer with pagination, date filter, excludes soft-deleted
transactionsApp.get("/customers/:id/transactions", async (c) => {
  const { id } = c.req.param();
  const { start, end, page = "1", pageSize = "10" } = c.req.query();
  const user = c.get("user");
  const db = getDb(c);
  const limit = parseInt(pageSize, 10);
  const offset = (parseInt(page, 10) - 1) * limit;

  const filters = [
    eq(transactions.customerId, id),
    eq(transactions.userId, user.id),
    isNull(transactions.deletedAt),
  ];
  if (start) filters.push(gte(transactions.createdAt, new Date(start)));
  if (end) filters.push(lte(transactions.createdAt, new Date(end)));

  const data = await db
    .select()
    .from(transactions)
    .where(and(...filters))
    .orderBy(desc(transactions.createdAt))
    .limit(limit)
    .offset(offset);

  // Total count (separate query)
  const total = await db
    .select()
    .from(transactions)
    .where(and(...filters));

  return c.json({
    data,
    page: parseInt(page, 10),
    pageSize: limit,
    total: total.length,
  });
});

// GET /transactions/:id - Get single transaction
transactionsApp.get("/:id", async (c) => {
  const { id } = c.req.param();
  const user = c.get("user");
  const db = getDb(c);
  const data = await db
    .select()
    .from(transactions)
    .where(
      and(
        eq(transactions.id, id),
        eq(transactions.userId, user.id),
        isNull(transactions.deletedAt),
      ),
    )
    .get();
  if (!data) return c.json({ error: "Transaction not found" }, 404);
  return c.json(data);
});

// POST /transactions - Create transaction
transactionsApp.post("/", async (c) => {
  const body = await c.req.json<{
    customerId: string;
    amount: number;
    type: "credit" | "debit";
    note?: string;
  }>();
  const user = c.get("user");
  const db = getDb(c);
  const now = new Date();
  const id = generateId();
  await db.insert(transactions).values({
    id,
    userId: user.id,
    customerId: body.customerId,
    amount: body.amount,
    type: body.type,
    note: body.note ?? null,
    createdAt: now,
    updatedAt: now,
  });
  const created = await db
    .select()
    .from(transactions)
    .where(eq(transactions.id, id))
    .get();
  return c.json(created, 201);
});

// PUT /transactions/:id - Update transaction
transactionsApp.put("/:id", async (c) => {
  const { id } = c.req.param();
  const body = await c.req.json<{
    amount?: number;
    type?: "credit" | "debit";
    note?: string;
  }>();
  const user = c.get("user");
  const db = getDb(c);
  await db
    .update(transactions)
    .set({ ...body, updatedAt: new Date() })
    .where(and(eq(transactions.id, id), eq(transactions.userId, user.id)));
  const updated = await db
    .select()
    .from(transactions)
    .where(eq(transactions.id, id))
    .get();
  if (!updated) return c.json({ error: "Transaction not found" }, 404);
  return c.json(updated);
});

// DELETE /transactions/:id - Soft delete
transactionsApp.delete("/:id", async (c) => {
  const { id } = c.req.param();
  const user = c.get("user");
  const db = getDb(c);
  await db
    .update(transactions)
    .set({ deletedAt: new Date() })
    .where(and(eq(transactions.id, id), eq(transactions.userId, user.id)));
  return c.json({ success: true });
});

// ── Transaction Tags CRUD ─────────────────────────────────────────────────────

// GET /transaction-tags
transactionsApp.get("/transaction-tags", async (c) => {
  const user = c.get("user");
  const db = getDb(c);
  const data = await db
    .select()
    .from(transactionTags)
    .where(eq(transactionTags.userId, user.id));
  return c.json(data);
});

// POST /transaction-tags
transactionsApp.post("/transaction-tags", async (c) => {
  const body = await c.req.json<{ name: string; color?: string }>();
  const user = c.get("user");
  const db = getDb(c);
  const now = new Date();
  const id = generateId();
  await db.insert(transactionTags).values({
    id,
    userId: user.id,
    name: body.name,
    color: body.color ?? null,
    createdAt: now,
    updatedAt: now,
  });
  const created = await db
    .select()
    .from(transactionTags)
    .where(eq(transactionTags.id, id))
    .get();
  return c.json(created, 201);
});

// PUT /transaction-tags/:id
transactionsApp.put("/transaction-tags/:id", async (c) => {
  const { id } = c.req.param();
  const body = await c.req.json<{ name?: string; color?: string }>();
  const user = c.get("user");
  const db = getDb(c);
  await db
    .update(transactionTags)
    .set({ ...body, updatedAt: new Date() })
    .where(
      and(eq(transactionTags.id, id), eq(transactionTags.userId, user.id)),
    );
  const updated = await db
    .select()
    .from(transactionTags)
    .where(eq(transactionTags.id, id))
    .get();
  if (!updated) return c.json({ error: "Tag not found" }, 404);
  return c.json(updated);
});

// DELETE /transaction-tags/:id
transactionsApp.delete("/transaction-tags/:id", async (c) => {
  const { id } = c.req.param();
  const user = c.get("user");
  const db = getDb(c);
  await db
    .delete(transactionTags)
    .where(
      and(eq(transactionTags.id, id), eq(transactionTags.userId, user.id)),
    );
  return c.json({ success: true });
});

// ── Tags on a Transaction ─────────────────────────────────────────────────────

// GET /transactions/:id/tags
transactionsApp.get("/:id/tags", async (c) => {
  const { id } = c.req.param();
  const db = getDb(c);
  const data = await db
    .select({ tag: transactionTags })
    .from(transactionTagMap)
    .innerJoin(transactionTags, eq(transactionTagMap.tagId, transactionTags.id))
    .where(eq(transactionTagMap.transactionId, id));
  return c.json(data.map((r) => r.tag));
});

// POST /transactions/:id/tags
transactionsApp.post("/:id/tags", async (c) => {
  const { id } = c.req.param();
  const { tag_id } = await c.req.json<{ tag_id: string }>();
  const db = getDb(c);
  await db.insert(transactionTagMap).values({
    transactionId: id,
    tagId: tag_id,
    createdAt: new Date(),
  });
  return c.json({ success: true }, 201);
});

// DELETE /transactions/:id/tags/:tagId
transactionsApp.delete("/:id/tags/:tagId", async (c) => {
  const { id, tagId } = c.req.param();
  const db = getDb(c);
  await db
    .delete(transactionTagMap)
    .where(
      and(
        eq(transactionTagMap.transactionId, id),
        eq(transactionTagMap.tagId, tagId),
      ),
    );
  return c.json({ success: true });
});

export default transactionsApp;
