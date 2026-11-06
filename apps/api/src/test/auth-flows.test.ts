import { describe, expect, it } from "bun:test";
import {
  FakeDb,
  authHeaders,
  fakeWithDb,
  makeTestApp,
  requestApp,
} from "./helpers";

function post(path: string, body: unknown, db: FakeDb, init?: RequestInit) {
  return requestApp(makeTestApp({ withDb: fakeWithDb(db) }), path, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(body),
    ...init,
  });
}

describe("removed password flows", () => {
  const removed = [
    ["/auth/signup", { email: "new@example.com", password: "password123" }],
    ["/auth/login", { email: "user@example.com", password: "password123" }],
    ["/auth/request-reset", { email: "user@example.com" }],
    [
      "/auth/reset-password",
      { email: "user@example.com", token: "token", newPassword: "password123" },
    ],
    [
      "/auth/change-password",
      { currentPassword: "old", newPassword: "password123" },
    ],
  ] as const;

  it.each(removed)("returns 410 with the JSON envelope for %s", async (path, body) => {
    const db = new FakeDb();

    const response = await post(path, body, db);

    expect(response.status).toBe(410);
    expect(await response.json()).toEqual({
      error: "Password authentication is removed. Use Google sign-in.",
    });
    expect(db.insertCalls).toBe(0);
    expect(db.updateCalls).toBe(0);
    expect(db.deleteCalls).toBe(0);
  });

  it("issues no session from removed endpoints", async () => {
    const db = new FakeDb();

    const response = await post(
      "/auth/login",
      { email: "user@example.com", password: "password123" },
      db,
    );

    const body = (await response.json()) as Record<string, unknown>;
    expect(body["token"]).toBeUndefined();
  });
});

describe("session lifecycle", () => {
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

  it("logs out and revokes the session", async () => {
    const db = new FakeDb();
    db.queueDelete();

    const response = await requestApp(
      makeTestApp({ withDb: fakeWithDb(db) }),
      "/auth/logout",
      { method: "POST", headers: authHeaders() },
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ success: true });
  });
});
