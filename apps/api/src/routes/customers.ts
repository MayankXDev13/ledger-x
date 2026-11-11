import { Hono } from "hono";
import { and, eq, isNull } from "drizzle-orm";
import { customers, transactions } from "../db/schema";
import { computeReceivables } from "../lib/receivables";
import type { AppEnv } from "../types/hono";
import { writeAudit } from "../lib/audit";
import { ensureDefaultBook } from "../lib/books";
import {
  createCustomerSchema,
  parseBody,
  updateCustomerSchema,
} from "../validators";
import { ApiError, isUniqueViolation, validationResponse } from "../lib/errors";

const customersApp = new Hono<AppEnv>();

// GET /customers - List all non-deleted customers
customersApp.get("/", async (ctx) => {
  const user = ctx.get("user");
  const { withDb } = ctx.get("deps");

  const data = await withDb(ctx, (db) =>
    db
      .select()
      .from(customers)
      .where(
        and(eq(customers.userId, user.id), isNull(customers.deletedAt)),
      ),
  );

  return ctx.json(data);
});

// GET /customers/balances - Balance map for all non-deleted customers
customersApp.get("/balances", async (ctx) => {
  const user = ctx.get("user");
  const { withDb } = ctx.get("deps");

  const [customerRows, entryRows] = await withDb(ctx, async (db) => {
    const customerRows = await db
      .select({ id: customers.id })
      .from(customers)
      .where(and(eq(customers.userId, user.id), isNull(customers.deletedAt)));

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
  const data: Record<string, { outstanding: number; ageDays: number | null }> = {};
  for (const c of customerRows) {
    const r = receivables.get(c.id);
    data[c.id] = {
      outstanding: r?.balance ?? 0,
      ageDays: r?.ageDays ?? null,
    };
  }

  return ctx.json(data);
});

// GET /customers/:id - Get customer
customersApp.get("/:id", async (ctx) => {
  const { id } = ctx.req.param();
  const user = ctx.get("user");
  const { withDb } = ctx.get("deps");

  const [data] = await withDb(ctx, (db) =>
    db
      .select()
      .from(customers)
      .where(
        and(
          eq(customers.id, id),
          eq(customers.userId, user.id),
          isNull(customers.deletedAt),
        ),
      )
      .limit(1),
  );

  if (!data) {
    throw new ApiError(404, "Customer not found");
  }

  return ctx.json(data);
});

// POST /customers - Create customer
customersApp.post("/", async (ctx) => {
  const { data: body, error } = await parseBody(
    ctx.req.raw,
    createCustomerSchema,
  );
  if (error) return validationResponse(ctx, error);

  const user = ctx.get("user");
  const { withDb } = ctx.get("deps");

  const created = await withDb(ctx, async (db) => {
    // Client-supplied id: replaying an accepted offline write returns the
    // existing owned record rather than creating a duplicate.
    if (body.id) {
      const [existing] = await db
        .select()
        .from(customers)
        .where(
          and(eq(customers.id, body.id), eq(customers.userId, user.id)),
        )
        .limit(1);

      if (existing) return existing;
    }

    const book = await ensureDefaultBook(db, user.id);

    try {
      const [customer] = await db
        .insert(customers)
        .values({
          id: body.id,
          userId: user.id,
          bookId: book.id,
          name: body.name,
          phone: body.phone,
        })
        .returning();

      return customer;
    } catch (error) {
      if (body.id && isUniqueViolation(error)) {
        const [owned] = await db
          .select()
          .from(customers)
          .where(
            and(eq(customers.id, body.id), eq(customers.userId, user.id)),
          )
          .limit(1);

        if (owned) return owned;
        throw new ApiError(404, "Customer not found");
      }

      throw error;
    }
  });

  await writeAudit(ctx, {
    actorUserId: user.id,
    action: "customer.create",
    entityType: "customer",
    entityId: created.id,
  });

  return ctx.json(created, 201);
});

// PUT /customers/:id - Update customer
customersApp.put("/:id", async (ctx) => {
  const { id } = ctx.req.param();
  const { data: body, error } = await parseBody(
    ctx.req.raw,
    updateCustomerSchema,
  );
  if (error) return validationResponse(ctx, error);

  const user = ctx.get("user");
  const { withDb } = ctx.get("deps");

  const updated = await withDb(ctx, async (db) => {
    const [customer] = await db
      .update(customers)
      .set({
        ...body,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(customers.id, id),
          eq(customers.userId, user.id),
          isNull(customers.deletedAt),
        ),
      )
      .returning();

    return customer;
  });

  if (!updated) {
    throw new ApiError(404, "Customer not found");
  }

  await writeAudit(ctx, {
    actorUserId: user.id,
    action: "customer.update",
    entityType: "customer",
    entityId: id,
    metadata: { ...body },
  });

  return ctx.json(updated);
});

// DELETE /customers/:id - Soft delete
customersApp.delete("/:id", async (ctx) => {
  const { id } = ctx.req.param();
  const user = ctx.get("user");
  const { withDb } = ctx.get("deps");

  const deleted = await withDb(ctx, (db) =>
    db
      .update(customers)
      .set({
        deletedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(customers.id, id),
          eq(customers.userId, user.id),
          isNull(customers.deletedAt),
        ),
      )
      .returning({ id: customers.id }),
  );

  if (deleted.length === 0) {
    throw new ApiError(404, "Customer not found");
  }

  return ctx.json({ success: true });
});

export default customersApp;
