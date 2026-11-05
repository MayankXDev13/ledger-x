import { describe, expect, it } from "bun:test";
import { FakeDb, authHeaders, fakeWithDb, makeTestApp, requestApp } from "./helpers";

describe("authentication", () => {
  it("rejects a request with no Authorization header", async () => {
    const response = await requestApp(makeTestApp(), "/customers");

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "Unauthorized" });
  });

  it("rejects a token that Supabase does not accept", async () => {
    const response = await requestApp(makeTestApp(), "/customers", {
      headers: authHeaders("invalid-token"),
    });

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "Invalid token" });
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
      "/transaction-tags",
      "/dashboard/metrics",
    ]) {
      const response = await requestApp(app, path);
      expect(response.status).toBe(401);
    }
  });
});
