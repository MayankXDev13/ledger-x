import { describe, expect, it } from "bun:test";
import { FakeDb, authHeaders, fakeWithDb, makeTestApp, requestApp } from "./helpers";

function appWith(db: FakeDb) {
  return makeTestApp({ withDb: fakeWithDb(db) });
}

function request(app: ReturnType<typeof appWith>, path: string, init: RequestInit = {}) {
  return requestApp(app, path, {
    ...init,
    headers: { ...authHeaders(), ...(init.headers ?? {}) },
  });
}

describe("removed tag routes", () => {
  it.each([
    ["/transaction-tags", "GET"],
    ["/transaction-tags", "POST"],
    ["/transaction-tags/00000000-0000-4000-8000-000000000001", "GET"],
    ["/transaction-tags/00000000-0000-4000-8000-000000000001", "PUT"],
    ["/transaction-tags/00000000-0000-4000-8000-000000000001", "DELETE"],
    ["/transactions/tx-1/tags", "GET"],
    ["/transactions/tx-1/tags", "POST"],
    ["/transactions/tx-1/tags/00000000-0000-4000-8000-000000000001", "DELETE"],
  ])("returns 404 with the JSON envelope for %s %s", async (path, method) => {
    const db = new FakeDb();

    const response = await request(appWith(db), path as string, {
      method: method as string,
      body: JSON.stringify({ name: "Food" }),
    });

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: "Not found" });
    expect(db.insertCalls).toBe(0);
    expect(db.updateCalls).toBe(0);
    expect(db.deleteCalls).toBe(0);
  });

  it("returns 404 for removed tag paths without authentication", async () => {
    const response = await requestApp(makeTestApp(), "/transaction-tags");

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: "Not found" });
  });
});

describe("transaction ownership", () => {
  const transaction = {
    id: "tx-1",
    userId: "user-1",
    customerId: "customer-1",
    amount: 1000,
    type: "credit",
  };

  it("resolves GET /transactions/:id for an owned transaction", async () => {
    const db = new FakeDb();
    db.queueSelect(transaction);

    const response = await request(appWith(db), "/transactions/tx-1");

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(transaction);
  });

  it("rejects a transaction for a foreign customer", async () => {
    const db = new FakeDb();
    db.queueSelect();

    const response = await request(appWith(db), "/transactions", {
      method: "POST",
      body: JSON.stringify({
        customerId: "00000000-0000-4000-8000-000000000000",
        amount: 100,
        type: "credit",
      }),
    });

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: "Customer not found" });
    expect(db.insertCalls).toBe(0);
  });

  it("creates a transaction for an owned customer", async () => {
    const db = new FakeDb();
    db.queueSelect({ id: "00000000-0000-4000-8000-000000000000" });
    db.queueInsert(transaction);

    const response = await request(appWith(db), "/transactions", {
      method: "POST",
      body: JSON.stringify({
        customerId: "00000000-0000-4000-8000-000000000000",
        amount: 100,
        type: "credit",
      }),
    });

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual(transaction);
  });

  it("returns 404 when updating a foreign transaction", async () => {
    const db = new FakeDb();
    db.queueUpdate();

    const response = await request(appWith(db), "/transactions/tx-1", {
      method: "PUT",
      body: JSON.stringify({ amount: 200 }),
    });

    expect(response.status).toBe(404);
  });

  it("returns 404 when deleting a foreign transaction", async () => {
    const db = new FakeDb();
    db.queueUpdate();

    const response = await request(appWith(db), "/transactions/tx-1", {
      method: "DELETE",
    });

    expect(response.status).toBe(404);
  });
});
