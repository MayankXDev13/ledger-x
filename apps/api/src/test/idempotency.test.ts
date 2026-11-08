import { describe, expect, it } from "bun:test";
import {
  FakeDb,
  authHeaders,
  fakeWithDb,
  makeTestApp,
  requestApp,
} from "./helpers";

const customerId = "11111111-1111-4111-8111-111111111111";
const clientId = "22222222-2222-4222-8222-222222222222";

function uniqueViolation() {
  const error = new Error("duplicate key value violates unique constraint");
  (error as { code?: string }).code = "23505";
  return error;
}

function appWith(db: FakeDb) {
  return makeTestApp({ withDb: fakeWithDb(db) });
}

describe("idempotent offline writes", () => {
  it("returns an existing transaction instead of creating a duplicate", async () => {
    const db = new FakeDb();
    db.queueSelect({ id: clientId, amount: 400, type: "debit" });

    const response = await requestApp(appWith(db), "/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({
        id: clientId,
        customerId,
        amount: 400,
        type: "debit",
      }),
    });

    expect(response.status).toBe(201);
    expect(await response.json()).toMatchObject({ id: clientId });
    expect(db.insertCalls).toBe(0);
  });

  it("returns the winning row after a concurrent transaction insert", async () => {
    const db = new FakeDb();
    db.queueSelect(); // no existing row yet
    db.queueSelect({ id: customerId, bookId: "book-1" }); // customer lookup
    db.queueInsertError(uniqueViolation());
    db.queueSelect({ id: clientId, amount: 400, type: "debit" }); // winner

    const response = await requestApp(appWith(db), "/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({
        id: clientId,
        customerId,
        amount: 400,
        type: "debit",
      }),
    });

    expect(response.status).toBe(201);
    expect(await response.json()).toMatchObject({ id: clientId });
  });

  it("hides another user's record on a cross-user id conflict", async () => {
    const db = new FakeDb();
    db.queueSelect(); // no owned row
    db.queueSelect({ id: customerId, bookId: "book-1" });
    db.queueInsertError(uniqueViolation());
    db.queueSelect(); // no owned row after conflict

    const response = await requestApp(appWith(db), "/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({
        id: clientId,
        customerId,
        amount: 400,
        type: "debit",
      }),
    });

    expect(response.status).toBe(404);
  });

  it("returns an existing customer instead of creating a duplicate", async () => {
    const db = new FakeDb();
    db.queueSelect({ id: clientId, name: "Ramesh", phone: "900" });

    const response = await requestApp(appWith(db), "/customers", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ id: clientId, name: "Ramesh", phone: "900" }),
    });

    expect(response.status).toBe(201);
    // One insert is the audit entry; the customer itself is not re-inserted.
    expect(db.insertCalls).toBe(1);
  });

  it("rejects a malformed client id", async () => {
    const response = await requestApp(makeTestApp(), "/customers", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ id: "not-a-uuid", name: "A", phone: "1" }),
    });

    expect(response.status).toBe(400);
  });
});
