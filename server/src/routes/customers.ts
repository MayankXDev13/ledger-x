import { Hono } from "hono";
import { eq, isNull, and } from "drizzle-orm";
import { getDb } from "../db";
import { customers } from "../db/schema";
import type { AppEnv } from "../types/hono";
import {
  createCustomerSchema,
  updateCustomerSchema,
  parseBody,
} from "../validators";

const customersApp = new Hono<AppEnv>();

// GET /customers - List all non-deleted customers
customersApp.get("/", async (ctx) => {
  const db = getDb(ctx);
  const user = ctx.get("user");
  const data = await db
    .select()
    .from(customers)
    .where(and(eq(customers.userId, user.id), isNull(customers.deletedAt)));
  return ctx.json(data);
});

// GET /customers/:id - Get customer
customersApp.get("/:id", async (ctx) => {
  const { id } = ctx.req.param();
  const db = getDb(ctx);
  const user = ctx.get("user");
  const [data] = await db
    .select()
    .from(customers)
    .where(
      and(
        eq(customers.id, id),
        eq(customers.userId, user.id),
        isNull(customers.deletedAt),
      ),
    )
    .limit(1);
  if (!data) return ctx.json({ error: "Customer not found" }, 404);
  return ctx.json(data);
});

// POST /customers - Create customer
customersApp.post("/", async (ctx) => {
  const { data: body, error } = await parseBody(
    ctx.req.raw,
    createCustomerSchema,
  );
  if (error) return ctx.json({ error: error.flatten().fieldErrors }, 400);

  const user = ctx.get("user");
  const db = getDb(ctx);
  const [created] = await db
    .insert(customers)
    .values({
      userId: user.id,
      name: body.name,
      phone: body.phone,
    })
    .returning();
  return ctx.json(created, 201);
});

// PUT /customers/:id - Update customer
customersApp.put("/:id", async (ctx) => {
  const { id } = ctx.req.param();
  const { data: body, error } = await parseBody(
    ctx.req.raw,
    updateCustomerSchema,
  );
  if (error) return ctx.json({ error: error.flatten().fieldErrors }, 400);

  const user = ctx.get("user");
  const db = getDb(ctx);
  const [updated] = await db
    .update(customers)
    .set({ ...body, updatedAt: new Date() })
    .where(and(eq(customers.id, id), eq(customers.userId, user.id)))
    .returning();
  if (!updated) return ctx.json({ error: "Customer not found" }, 404);
  return ctx.json(updated);
});

// DELETE /customers/:id - Soft delete
customersApp.delete("/:id", async (ctx) => {
  const { id } = ctx.req.param();
  const user = ctx.get("user");
  const db = getDb(ctx);
  await db
    .update(customers)
    .set({ deletedAt: new Date() })
    .where(and(eq(customers.id, id), eq(customers.userId, user.id)));
  return ctx.json({ success: true });
});

export default customersApp;
