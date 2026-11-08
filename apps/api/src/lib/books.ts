import { and, eq } from "drizzle-orm";
import type { Db } from "../db";
import { books } from "../db/schema";
import { isUniqueViolation } from "./errors";

export type BookRecord = {
  id: string;
  userId: string;
  name: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
};

/**
 * Returns the user's default book, creating it on first use.
 *
 * The partial unique index on (user_id) WHERE is_default keeps concurrent
 * first requests from creating duplicates: the loser of the race catches
 * the unique violation and re-reads the winner's row.
 */
export async function ensureDefaultBook(db: Db, userId: string): Promise<BookRecord> {
  const [existing] = await db
    .select()
    .from(books)
    .where(and(eq(books.userId, userId), eq(books.isDefault, true)))
    .limit(1);

  if (existing) return existing as BookRecord;

  try {
    const [created] = await db
      .insert(books)
      .values({ userId, name: "My Ledger", isDefault: true })
      .returning();

    if (created) return created as BookRecord;
  } catch (error) {
    if (!isUniqueViolation(error)) throw error;
  }

  const [raced] = await db
    .select()
    .from(books)
    .where(and(eq(books.userId, userId), eq(books.isDefault, true)))
    .limit(1);

  if (!raced) {
    throw new Error("Default book could not be created");
  }

  return raced as BookRecord;
}
