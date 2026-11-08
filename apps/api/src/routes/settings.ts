import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { userSettings } from "../db/schema";
import { ensureUserSettings } from "../lib/settings";
import { parseBody, settingsUpdateSchema } from "../validators";
import { ApiError, validationResponse } from "../lib/errors";
import type { AppEnv } from "../types/hono";

const settingsApp = new Hono<AppEnv>();

function serialize(settings: Awaited<ReturnType<typeof ensureUserSettings>>) {
  return {
    upiId: settings.upiId,
    payeeName: settings.payeeName,
    onboardingCompletedAt: settings.onboardingCompletedAt,
    onboardingDismissedAt: settings.onboardingDismissedAt,
  };
}

// GET /settings - UPI configuration and onboarding state for the caller.
settingsApp.get("/", async (ctx) => {
  const user = ctx.get("user");
  const { withDb } = ctx.get("deps");

  const settings = await withDb(ctx, (db) =>
    ensureUserSettings(db, user.id),
  );

  return ctx.json(serialize(settings));
});

// PUT /settings - Partial update; null clears a field.
settingsApp.put("/", async (ctx) => {
  const { data: body, error } = await parseBody(
    ctx.req.raw,
    settingsUpdateSchema,
  );
  if (error) return validationResponse(ctx, error);

  const user = ctx.get("user");
  const { withDb } = ctx.get("deps");
  const now = new Date();

  const updated = await withDb(ctx, async (db) => {
    await ensureUserSettings(db, user.id);

    const set: Record<string, unknown> = { updatedAt: now };

    if (body.upiId !== undefined) set.upiId = body.upiId ?? null;
    if (body.payeeName !== undefined) set.payeeName = body.payeeName ?? null;
    if (body.onboardingCompleted !== undefined) {
      set.onboardingCompletedAt = body.onboardingCompleted ? now : null;
    }
    if (body.onboardingDismissed !== undefined) {
      set.onboardingDismissedAt = body.onboardingDismissed ? now : null;
    }

    const [row] = await db
      .update(userSettings)
      .set(set)
      .where(eq(userSettings.userId, user.id))
      .returning();

    return row;
  });

  if (!updated) throw new ApiError(500, "Settings update failed");

  return ctx.json(serialize(updated));
});

export default settingsApp;
