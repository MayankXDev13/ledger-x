import { describe, expect, it } from "bun:test";
import { FakeDb, authHeaders, fakeWithDb, fakeVerifyToken, makeTestApp, requestApp } from "./helpers";
import { getAuth } from "../lib/better-auth";
import type { Bindings } from "../types/hono";

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

  it("accepts a valid Better Auth session token", async () => {
    const response = await requestApp(makeTestApp(), "/auth/me", {
      headers: authHeaders(),
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      id: "user-1",
      email: "user@example.com",
    });
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
      name: "Test User",
      image: "https://example.com/avatar.png",
    });
  });

  it("returns null image when the user has none", async () => {
    const response = await requestApp(
      makeTestApp({
        verifyToken: fakeVerifyToken({
          id: "user-1",
          email: "user@example.com",
          name: "Test User",
          image: null,
        }),
      }),
      "/auth/me",
      { headers: authHeaders() },
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      id: "user-1",
      email: "user@example.com",
      name: "Test User",
      image: null,
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
      "/audit-logs",
    ]) {
      const response = await requestApp(app, path);
      expect(response.status).toBe(401);
    }
  });
});

describe("auth configuration", () => {
  const env = {
    HYPERDRIVE: { connectionString: "postgresql://test/test" },
    GOOGLE_CLIENT_ID: "test-client-id",
    GOOGLE_CLIENT_SECRET: "test-client-secret",
    BETTER_AUTH_SECRET: "test-secret",
  } as unknown as Bindings;

  it("fails fast when Google credentials are missing", () => {
    expect(() => getAuth({} as Bindings)).toThrow(
      /missing GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, BETTER_AUTH_SECRET/,
    );
  });

  it("builds a Google-only auth instance", () => {
    const { auth, release } = getAuth(env);

    expect(typeof auth.handler).toBe("function");
    expect(typeof auth.api.getSession).toBe("function");
    expect(auth.options.emailAndPassword?.enabled).toBe(false);
    expect(
      (auth.options.socialProviders as Record<string, unknown> | undefined)?.[
        "google"
      ],
    ).toBeDefined();
    expect(
      (
        auth.options.account as
          | { accountLinking?: { trustedProviders?: unknown } }
          | undefined
      )?.accountLinking?.trustedProviders,
    ).toContain("google");

    void release;
  });
});
