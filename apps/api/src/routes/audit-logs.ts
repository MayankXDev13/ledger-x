import { Hono } from "hono";
import { and, desc, eq, gte, lte } from "drizzle-orm";
import { auditLogs } from "../db/schema";
import type { AppEnv } from "../types/hono";
import { parseQuery } from "../validators";
import { auditQuerySchema } from "../validators";
import { ApiError, validationResponse } from "../lib/errors";

const auditLogsApp = new Hono<AppEnv>();

auditLogsApp.get("/", async (ctx) => {
  const user = ctx.get("user");
  const { data: query, error } = parseQuery(ctx.req.query(), auditQuerySchema);
  if (error) return validationResponse(ctx, error);
  const { withDb } = ctx.get("deps");
  const filters = [eq(auditLogs.actorUserId, user.id)];
  if (query.from) filters.push(gte(auditLogs.createdAt, new Date(query.from)));
  if (query.to) filters.push(lte(auditLogs.createdAt, new Date(query.to)));
  const offset = (query.page - 1) * query.pageSize;
  const data = await withDb(ctx, (db) =>
    db
      .select()
      .from(auditLogs)
      .where(and(...filters))
      .orderBy(desc(auditLogs.createdAt))
      .limit(query.pageSize)
      .offset(offset)
  );
  return ctx.json({ data, page: query.page, pageSize: query.pageSize });
});

auditLogsApp.get("/:id", async (ctx) => {
  const user = ctx.get("user");
  const { id } = ctx.req.param();
  const { withDb } = ctx.get("deps");
  const [row] = await withDb(ctx, (db) =>
    db.select().from(auditLogs).where(eq(auditLogs.id, id)).limit(1)
  );
  if (!row || row.actorUserId !== user.id) throw new ApiError(404, "Audit entry not found");
  return ctx.json(row);
});

export default auditLogsApp;
