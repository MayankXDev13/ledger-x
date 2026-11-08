import { describe, expect, it } from "bun:test";
import {
  FakeDb,
  authHeaders,
  fakeWithDb,
  makeTestApp,
  requestApp,
} from "./helpers";

const emptySettings = {
  userId: "user-1",
  upiId: null,
  payeeName: null,
  onboardingCompletedAt: null,
  onboardingDismissedAt: null,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-01T00:00:00.000Z"),
};

function appWith(db: FakeDb) {
  return makeTestApp({ withDb: fakeWithDb(db) });
}

describe("user settings", () => {
  it("creates and returns an empty settings row on first read", async () => {
    const db = new FakeDb();
    db.queueSelect();
    db.queueInsert(emptySettings);

    const response = await requestApp(appWith(db), "/settings", {
      headers: authHeaders(),
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      upiId: null,
      payeeName: null,
      onboardingCompletedAt: null,
    });
  });

  it("saves a valid UPI ID", async () => {
    const db = new FakeDb();
    db.queueSelect(emptySettings);
    db.queueUpdate({
      ...emptySettings,
      upiId: "ramesh@okhdfcbank",
      payeeName: "Ramesh Kirana",
    });

    const response = await requestApp(appWith(db), "/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({
        upiId: "ramesh@okhdfcbank",
        payeeName: "Ramesh Kirana",
      }),
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      upiId: "ramesh@okhdfcbank",
      payeeName: "Ramesh Kirana",
    });
  });

  it("rejects an invalid UPI ID", async () => {
    const db = new FakeDb();

    const response = await requestApp(appWith(db), "/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ upiId: "not-a-vpa" }),
    });
    const body = (await response.json()) as { details?: Record<string, unknown> };

    expect(response.status).toBe(400);
    expect(body.details).toHaveProperty("upiId");
    expect(db.updateCalls).toBe(0);
  });

  it("clears the UPI ID when null is sent", async () => {
    const db = new FakeDb();
    db.queueSelect({ ...emptySettings, upiId: "ramesh@okhdfcbank" });
    db.queueUpdate({ ...emptySettings, upiId: null });

    const response = await requestApp(appWith(db), "/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ upiId: null }),
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ upiId: null });
  });

  it("records onboarding completion and dismissal", async () => {
    const db = new FakeDb();
    db.queueSelect(emptySettings);
    db.queueUpdate({
      ...emptySettings,
      onboardingCompletedAt: new Date(),
      onboardingDismissedAt: new Date(),
    });

    const response = await requestApp(appWith(db), "/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({
        onboardingCompleted: true,
        onboardingDismissed: true,
      }),
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      onboardingCompletedAt: expect.anything(),
      onboardingDismissedAt: expect.anything(),
    });
  });

  it("requires authentication", async () => {
    const response = await requestApp(makeTestApp(), "/settings");
    expect(response.status).toBe(401);
  });
});
