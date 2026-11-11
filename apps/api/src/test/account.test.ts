import { describe, expect, it } from "bun:test";
import {
  FakeDb,
  authHeaders,
  fakeWithDb,
  makeTestApp,
  queueFlags,
  requestApp,
} from "./helpers";

function appWith(db: FakeDb) {
  return makeTestApp({ withDb: fakeWithDb(db) });
}

describe("account data portability", () => {
  it("archives owned records and flags soft-deleted ones", async () => {
    const db = new FakeDb();
    db.queueSelect({
      id: "c1",
      name: "Ramesh",
      phone: "900",
      deletedAt: null,
    });
    db.queueSelect({
      id: "t1",
      customerId: "c1",
      amount: 100,
      type: "credit",
      deletedAt: new Date("2026-01-01T00:00:00.000Z"),
    });

    const response = await requestApp(appWith(db), "/account/export", {
      headers: authHeaders(),
    });
    const body = (await response.json()) as {
      customers: { deleted: boolean }[];
      transactions: { deleted: boolean }[];
      user: { id: string };
    };

    expect(response.status).toBe(200);
    expect(body.user.id).toBe("user-1");
    expect(body.customers[0].deleted).toBe(false);
    expect(body.transactions[0].deleted).toBe(true);
  });

  it("refuses deletion without explicit confirmation", async () => {
    const db = new FakeDb();
    queueFlags(db);

    const response = await requestApp(appWith(db), "/account", {
      method: "DELETE",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({}),
    });
    const body = (await response.json()) as { details?: Record<string, unknown> };

    expect(response.status).toBe(400);
    expect(body.details).toHaveProperty("confirm");
    expect(db.deleteCalls).toBe(0);
    expect(db.insertCalls).toBe(0);
  });

  it("records the request before deleting the account", async () => {
    const db = new FakeDb();
    queueFlags(db);
    db.queueInsert({ id: "audit-1" }); // account.delete entry
    db.queueDelete({ id: "user-1" }); // user row removed

    const response = await requestApp(appWith(db), "/account", {
      method: "DELETE",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ confirm: "DELETE" }),
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ success: true });
    expect(db.insertCalls).toBe(1);
    expect(db.deleteCalls).toBe(1);
  });

  it("records a failed deletion attempt without clearing data", async () => {
    const db = new FakeDb();
    queueFlags(db);
    db.queueInsert({ id: "audit-1" }); // requested marker
    db.queueDeleteError(new Error("database unavailable"));
    db.queueInsert({ id: "audit-2" }); // failed marker

    const response = await requestApp(appWith(db), "/account", {
      method: "DELETE",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ confirm: "DELETE" }),
    });

    expect(response.status).toBe(500);
    expect(db.insertCalls).toBe(2);
    expect(db.deleteCalls).toBe(1);
  });

  it("rejects deletion when account_deletion flag is disabled", async () => {
    const db = new FakeDb();
    queueFlags(db, { account_deletion: false });

    const response = await requestApp(appWith(db), "/account", {
      method: "DELETE",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ confirm: "DELETE" }),
    });

    expect(response.status).toBe(403);
    expect(db.deleteCalls).toBe(0);
  });
});
