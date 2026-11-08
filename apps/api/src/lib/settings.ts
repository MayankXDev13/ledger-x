import type { Db } from "../db";
import { userSettings } from "../db/schema";

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
  // Single-statement upsert: two concurrent first-use calls (e.g. parallel
  // settings saves on app launch) must not fail one another with a unique
  // violation the way select-then-insert does.
  const [row] = await db
    .insert(userSettings)
    .values({ userId })
    .onConflictDoUpdate({
      target: userSettings.userId,
      set: { updatedAt: new Date() },
    })
    .returning();

  if (!row) throw new Error("User settings could not be created");

  return row as UserSettingsRecord;
}
