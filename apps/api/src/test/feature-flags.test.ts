import { describe, expect, it } from "bun:test";
import {
  FakeDb,
  authHeaders,
  fakeWithDb,
  makeTestApp,
  queueFlags,
  requestApp,
} from "./helpers";
import type { Db } from "../db";
import { isEnabled, readFeatureFlags } from "../lib/feature-flags";

function dbWith(rows: Record<string, unknown>[]): FakeDb {
  const db = new FakeDb();
  db.queueSelect(...rows);
  return db;
}

function appWith(db: FakeDb) {
  return makeTestApp({ withDb: fakeWithDb(db) });
}

describe("readFeatureFlags", () => {
  it("returns the enabled state of every registered flag", async () => {
    const db = dbWith([
      { key: "collection", enabled: true },
      { key: "upi_collection", enabled: false },
    ]);

    const flags = await readFeatureFlags(db as unknown as Db);

    expect(flags.collection).toBe(true);
    expect(flags.upi_collection).toBe(false);
  });

  it("resolves a shipped flag the registry does not carry to disabled", async () => {
    const db = dbWith([{ key: "collection", enabled: true }]);

    const flags = await readFeatureFlags(db as unknown as Db);

    expect(flags.collection).toBe(true);
    expect(flags.upi_collection).toBe(false);
  });

  it("keeps a flag the administrator added at run time", async () => {
    const db = dbWith([{ key: "statements", enabled: true }]);

    const flags = await readFeatureFlags(db as unknown as Db);

    expect(flags.statements).toBe(true);
  });

  it("fails open when the registry cannot be read", async () => {
    const db = new FakeDb();
    db.queueSelectError(new Error('relation "feature_flags" does not exist'));

    const flags = await readFeatureFlags(db as unknown as Db);

    expect(flags.collection).toBe(true);
    expect(flags.upi_collection).toBe(true);
    expect(flags.sample_data).toBe(true);
    expect(flags.account_deletion).toBe(true);
  });
});

describe("isEnabled", () => {
  it("reports a flag that is on", () => {
    expect(isEnabled({ collection: true }, "collection")).toBe(true);
  });

  it("treats a flag that is off as off", () => {
    expect(isEnabled({ collection: false }, "collection")).toBe(false);
  });

  it("treats an unknown flag as off", () => {
    expect(isEnabled({}, "collection")).toBe(false);
  });
});

describe("GET /feature-flags", () => {
  it("publishes the registry without authentication", async () => {
    const db = new FakeDb();
    queueFlags(db);

    const response = await requestApp(appWith(db), "/feature-flags");
    const body = (await response.json()) as {
      flags: Record<string, boolean>;
    };

    expect(response.status).toBe(200);
    expect(body.flags).toEqual({
      collection: true,
      upi_collection: true,
      sample_data: true,
      account_deletion: true,
    });
  });

  it("reports a flag the administrator switched off", async () => {
    const db = new FakeDb();
    queueFlags(db, { collection: false });

    const response = await requestApp(appWith(db), "/feature-flags");
    const body = (await response.json()) as {
      flags: Record<string, boolean>;
    };

    expect(response.status).toBe(200);
    expect(body.flags.collection).toBe(false);
    expect(body.flags.upi_collection).toBe(true);
    expect(body.flags.sample_data).toBe(true);
    expect(body.flags.account_deletion).toBe(true);
  });

  it("offers no route that changes a flag", async () => {
    const db = new FakeDb();
    queueFlags(db);

    const response = await requestApp(appWith(db), "/feature-flags", {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ flags: { collection: false } }),
    });

    expect(response.status).toBe(404);
  });

  it("ignores a flag key sent in another request", async () => {
    const db = new FakeDb();
    queueFlags(db, { collection: true });
    db.queueInsert({
      userId: "user-1",
      upiId: null,
      payeeName: null,
      onboardingCompletedAt: null,
      onboardingDismissedAt: null,
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    });
    db.queueUpdate({
      userId: "user-1",
      upiId: null,
      payeeName: null,
      onboardingCompletedAt: new Date(),
      onboardingDismissedAt: null,
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    });

    const response = await requestApp(appWith(db), "/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({
        onboardingCompleted: true,
        flags: { collection: false },
      }),
    });

    expect(response.status).toBe(200);

    // The flag the client tried to steer still resolves to the registry's
    // value.
    queueFlags(db, { collection: true });
    const read = await requestApp(appWith(db), "/feature-flags");
    const body = (await read.json()) as { flags: Record<string, boolean> };

    expect(body.flags.collection).toBe(true);
  });
});
