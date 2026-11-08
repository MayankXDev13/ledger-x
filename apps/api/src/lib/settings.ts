import { eq } from "drizzle-orm";
import type { Db } from "../db";
import { userSettings } from "../db/schema";
import { isUniqueViolation } from "./errors";

export type UserSettingsRecord = {
  userId: string;
  upiId: string | null;
  payeeName: string | null;
  onboardingCompletedAt: Date | null;
  onboardingDismissedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

/** Returns the user's settings row, creating an empty one on first use. */
export async function ensureUserSettings(
  db: Db,
  userId: string,
): Promise<UserSettingsRecord> {
  const [existing] = await db
    .select()
    .from(userSettings)
    .where(eq(userSettings.userId, userId))
    .limit(1);

  if (existing) return existing as UserSettingsRecord;

  try {
    const [created] = await db
      .insert(userSettings)
      .values({ userId })
      .returning();

    if (created) return created as UserSettingsRecord;
  } catch (error) {
    if (!isUniqueViolation(error)) throw error;
  }

  const [raced] = await db
    .select()
    .from(userSettings)
    .where(eq(userSettings.userId, userId))
    .limit(1);

  if (!raced) throw new Error("User settings could not be created");

  return raced as UserSettingsRecord;
}
