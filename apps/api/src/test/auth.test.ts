import { describe, expect, it } from "bun:test";
import { FakeDb, authHeaders, fakeWithDb, makeTestApp, requestApp } from "./helpers";
import { verifyToken } from "../lib/auth";

function sessionContext(db: FakeDb) {
  return {
    get: (key: string) =>
      key === "deps" ? { withDb: fakeWithDb(db) } : undefined,
  } as never;
}

describe("authentication", () => {
  it("rejects a request with no Authorization header", async () => {
    const response = await requestApp(makeTestApp(), "/customers");

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "Unauthorized" });
  });

  it("rejects a token that Better Auth does not accept", async () => {
    const response = await requestApp(makeTestApp(), "/customers", {
      headers: authHeaders("invalid-token"),
    });

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "Invalid token" });
  });

  it("rejects a pre-migration Supabase token after cutover", async () => {
    const response = await requestApp(makeTestApp(), "/auth/me", {
      headers: authHeaders("legacy-token"),
    });

    expect(response.status).toBe(401);
  });

  it("accepts a valid Better Auth session token", async () => {
    const db = new FakeDb();
    db.queueSelect({
      token: "session-token",
      expiresAt: new Date(Date.now() + 3600_000),
      id: "user-1",
      email: "user@example.com",
    });

    const user = await verifyToken(sessionContext(db), "session-token");

    expect(user).toEqual({ id: "user-1", email: "user@example.com" });
  });

  it("rejects an expired Better Auth session token", async () => {
    const db = new FakeDb();
    db.queueSelect({
      token: "stale-token",
      expiresAt: new Date(Date.now() - 1000),
      id: "user-1",
      email: "user@example.com",
    });

    const user = await verifyToken(sessionContext(db), "stale-token");

    expect(user).toBeNull();
  });

  it("does not run a protected handler without a user", async () => {
    let called = false;
    const app = makeTestApp({
      withDb: async (_ctx, fn) => {
        called = true;
        return fn({} as never);
      },
    });

    const response = await requestApp(app, "/customers");

    expect(response.status).toBe(401);
    expect(called).toBe(false);
  });

  it("returns the authenticated user from /auth/me", async () => {
    const response = await requestApp(makeTestApp(), "/auth/me", {
      headers: authHeaders(),
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      id: "user-1",
      email: "user@example.com",
    });
  });

  it("reaches a protected handler with a valid token", async () => {
    const db = new FakeDb();
    db.queueSelect();

    const response = await requestApp(
      makeTestApp({ withDb: fakeWithDb(db) }),
      "/customers",
      { headers: authHeaders() },
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([]);
  });

  it("protects every domain router", async () => {
    const app = makeTestApp();

    for (const path of [
      "/customers",
      "/transactions/customers/customer-1/transactions",
      "/dashboard/metrics",
    ]) {
      const response = await requestApp(app, path);
      expect(response.status).toBe(401);
    }
  });
});
