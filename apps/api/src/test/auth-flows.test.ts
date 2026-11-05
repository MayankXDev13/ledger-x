import { describe, expect, it } from "bun:test";
import {
  FakeDb,
  authHeaders,
  fakeWithDb,
  makeTestApp,
  requestApp,
} from "./helpers";

async function passwordHash(password: string): Promise<string> {
  const data = new TextEncoder().encode(`ledgerx:${password}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest), (b) =>
    b.toString(16).padStart(2, "0")
  ).join("");
}

function json(path: string, body: unknown, db: FakeDb, init?: RequestInit) {
  return requestApp(makeTestApp({ withDb: fakeWithDb(db) }), path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    ...init,
  });
}

describe("auth flows", () => {
  it("signs up a new user and returns a session token", async () => {
    const db = new FakeDb();
    db.queueSelect();
    db.queueInsert({ id: "new-user", email: "new@example.com" });

    const response = await json(
      "/auth/signup",
      { email: "new@example.com", password: "password123" },
      db,
    );

    expect(response.status).toBe(201);
    const body = (await response.json()) as { email: string; token: string };
    expect(body.email).toBe("new@example.com");
    expect(typeof body.token).toBe("string");
  });

  it("rejects duplicate signup", async () => {
    const db = new FakeDb();
    db.queueSelect({ id: "existing", email: "dup@example.com" });

    const response = await json(
      "/auth/signup",
      { email: "dup@example.com", password: "password123" },
      db,
    );

    expect(response.status).toBe(409);
  });

  it("logs in with correct password", async () => {
    const db = new FakeDb();
    db.queueSelect({ id: "user-1", email: "user@example.com" });
    db.queueSelect({
      id: "acc-1",
      userId: "user-1",
      password: await passwordHash("correct-horse"),
    });

    const response = await json(
      "/auth/login",
      { email: "user@example.com", password: "correct-horse" },
      db,
    );

    expect(response.status).toBe(200);
    const body = (await response.json()) as { token: string };
    expect(typeof body.token).toBe("string");
  });

  it("rejects login with wrong password and logs the failure", async () => {
    const db = new FakeDb();
    db.queueSelect({ id: "user-1", email: "user@example.com" });
    db.queueSelect({
      id: "acc-1",
      userId: "user-1",
      password: await passwordHash("correct-horse"),
    });

    const response = await json(
      "/auth/login",
      { email: "user@example.com", password: "wrong" },
      db,
    );

    expect(response.status).toBe(401);
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
  });
});
