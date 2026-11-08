import { Hono } from "hono";
import { ensureDefaultBook } from "../lib/books";
import type { AppEnv } from "../types/hono";

const booksApp = new Hono<AppEnv>();

// GET /books - Return the user's default book, creating it on first use.
booksApp.get("/", async (ctx) => {
  const user = ctx.get("user");
  const { withDb } = ctx.get("deps");

  const book = await withDb(ctx, (db) => ensureDefaultBook(db, user.id));

  return ctx.json(book);
});

export default booksApp;
