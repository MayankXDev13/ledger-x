import { Hono } from "hono";
import { and, eq } from "drizzle-orm";
import { transactionTags } from "../db/schema";
import type { AppEnv } from "../types/hono";
import { createTagSchema, parseBody, updateTagSchema } from "../validators";
import {
  ApiError,
  isUniqueViolation,
  validationResponse,
} from "../lib/errors";

const tagsApp = new Hono<AppEnv>();

// GET /transaction-tags
tagsApp.get("/", async (ctx) => {
  const user = ctx.get("user");
  const { withDb } = ctx.get("deps");

  const data = await withDb(ctx, (db) =>
    db
      .select()
      .from(transactionTags)
      .where(eq(transactionTags.userId, user.id)),
  );

  return ctx.json(data);
});

// POST /transaction-tags
tagsApp.post("/", async (ctx) => {
  const { data: body, error } = await parseBody(
    ctx.req.raw,
    createTagSchema,
  );
  if (error) return validationResponse(ctx, error);

  const user = ctx.get("user");
  const { withDb } = ctx.get("deps");

  try {
    const created = await withDb(ctx, async (db) => {
      const [tag] = await db
        .insert(transactionTags)
        .values({
          userId: user.id,
          name: body.name,
          color: body.color,
        })
        .returning();
      return tag;
    });

    return ctx.json(created, 201);
  } catch (err) {
    if (isUniqueViolation(err)) {
      throw new ApiError(409, "Tag name already exists");
    }
    throw err;
  }
});

// PUT /transaction-tags/:id
tagsApp.put("/:id", async (ctx) => {
  const { id } = ctx.req.param();
  const { data: body, error } = await parseBody(
    ctx.req.raw,
    updateTagSchema,
  );
  if (error) return validationResponse(ctx, error);

  const user = ctx.get("user");
  const { withDb } = ctx.get("deps");

  try {
    const updated = await withDb(ctx, async (db) => {
      const [tag] = await db
        .update(transactionTags)
        .set({ ...body, updatedAt: new Date() })
        .where(
          and(
            eq(transactionTags.id, id),
            eq(transactionTags.userId, user.id),
          ),
        )
        .returning();
      return tag;
    });

    if (!updated) {
      throw new ApiError(404, "Tag not found");
    }

    return ctx.json(updated);
  } catch (err) {
    if (isUniqueViolation(err)) {
      throw new ApiError(409, "Tag name already exists");
    }
    throw err;
  }
});

// DELETE /transaction-tags/:id
tagsApp.delete("/:id", async (ctx) => {
  const { id } = ctx.req.param();
  const user = ctx.get("user");
  const { withDb } = ctx.get("deps");

  const deleted = await withDb(ctx, (db) =>
    db
      .delete(transactionTags)
      .where(
        and(eq(transactionTags.id, id), eq(transactionTags.userId, user.id)),
      )
      .returning({ id: transactionTags.id }),
  );

  if (deleted.length === 0) {
    throw new ApiError(404, "Tag not found");
  }

  return ctx.json({ success: true });
});

export default tagsApp;
