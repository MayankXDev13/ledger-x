import { Hono } from 'hono';
import { eq, isNull, and } from 'drizzle-orm';
import { getDb } from '../db';
import { customers } from '../db/schema';
import type { AppEnv } from '../types/hono';

const customersApp = new Hono<AppEnv>();

// GET /customers - List all non-deleted customers
customersApp.get('/', async (c) => {
  const db = getDb(c);
  const user = c.get('user');
  const data = await db
    .select()
    .from(customers)
    .where(and(eq(customers.userId, user.id), isNull(customers.deletedAt)));
  return c.json(data);
});

// GET /customers/:id - Get customer
customersApp.get('/:id', async (c) => {
  const { id } = c.req.param();
  const db = getDb(c);
  const user = c.get('user');
  const [data] = await db
    .select()
    .from(customers)
    .where(and(eq(customers.id, id), eq(customers.userId, user.id), isNull(customers.deletedAt)))
    .limit(1);
  if (!data) return c.json({ error: 'Customer not found' }, 404);
  return c.json(data);
});

// POST /customers - Create customer
customersApp.post('/', async (c) => {
  const body = await c.req.json<{ name: string; phone: string }>();
  const user = c.get('user');
  const db = getDb(c);
  const [created] = await db
    .insert(customers)
    .values({
      userId: user.id,
      name: body.name,
      phone: body.phone,
    })
    .returning();
  return c.json(created, 201);
});

// PUT /customers/:id - Update customer
customersApp.put('/:id', async (c) => {
  const { id } = c.req.param();
  const body = await c.req.json<{ name?: string; phone?: string }>();
  const user = c.get('user');
  const db = getDb(c);
  const [updated] = await db
    .update(customers)
    .set({ ...body, updatedAt: new Date() })
    .where(and(eq(customers.id, id), eq(customers.userId, user.id)))
    .returning();
  if (!updated) return c.json({ error: 'Customer not found' }, 404);
  return c.json(updated);
});

// DELETE /customers/:id - Soft delete
customersApp.delete('/:id', async (c) => {
  const { id } = c.req.param();
  const user = c.get('user');
  const db = getDb(c);
  await db
    .update(customers)
    .set({ deletedAt: new Date() })
    .where(and(eq(customers.id, id), eq(customers.userId, user.id)));
  return c.json({ success: true });
});

export default customersApp;
