import { describe, expect, it } from "bun:test";
import {
  FakeDb,
  authHeaders,
  fakeWithDb,
  makeTestApp,
  requestApp,
} from "./helpers";

describe("audit logs", () => {
  it("requires authentication", async () => {
    const response = await requestApp(makeTestApp(), "/audit-logs");

    expect(response.status).toBe(401);
  });

  it("lists the caller's own entries", async () => {
    const db = new FakeDb();
    db.queueSelect({
      id: "audit-1",
      actorUserId: "user-1",
      action: "customer.create",
      entityType: "customer",
      entityId: "customer-1",
    });

    const response = await requestApp(
      makeTestApp({ withDb: fakeWithDb(db) }),
      "/audit-logs",
      { headers: authHeaders() },
    );

    expect(response.status).toBe(200);
    const body = (await response.json()) as {
      data: unknown[];
      page: number;
    };
    expect(body.data).toHaveLength(1);
    expect(body.page).toBe(1);
  });

  it("hides another user's entry", async () => {
    const db = new FakeDb();
    db.queueSelect({
      id: "audit-9",
      actorUserId: "user-2",
      action: "customer.create",
      entityType: "customer",
      entityId: "customer-9",
    });

    const response = await requestApp(
      makeTestApp({ withDb: fakeWithDb(db) }),
      "/audit-logs/audit-9",
      { headers: authHeaders() },
    );

    expect(response.status).toBe(404);
  });

  it("creates no audit entry on reads", async () => {
    const db = new FakeDb();
    db.queueSelect();

    await requestApp(
      makeTestApp({ withDb: fakeWithDb(db) }),
      "/customers",
      { headers: authHeaders() },
    );

    expect(db.insertCalls).toBe(0);
  });
});
