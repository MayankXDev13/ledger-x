import { describe, expect, it } from "bun:test";
import { FakeDb, authHeaders, fakeWithDb, makeTestApp, requestApp } from "./helpers";

const tag = {
  id: "00000000-0000-4000-8000-000000000001",
  userId: "user-1",
  name: "Food",
  color: "#ff0000",
};

const transaction = {
  id: "tx-1",
  userId: "user-1",
  customerId: "customer-1",
  amount: 1000,
  type: "credit",
};

function appWith(db: FakeDb) {
  return makeTestApp({ withDb: fakeWithDb(db) });
}

function request(app: ReturnType<typeof appWith>, path: string, init: RequestInit = {}) {
  return requestApp(app, path, {
    ...init,
    headers: { ...authHeaders(), ...(init.headers ?? {}) },
  });
}

describe("tag CRUD", () => {
  it("lists tags through the top-level route", async () => {
    const db = new FakeDb();
    db.queueSelect(tag);

    const response = await request(appWith(db), "/transaction-tags");

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([tag]);
  });

  it("creates a tag", async () => {
    const db = new FakeDb();
    db.queueInsert(tag);

    const response = await request(appWith(db), "/transaction-tags", {
      method: "POST",
      body: JSON.stringify({ name: "Food", color: "#ff0000" }),
    });

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual(tag);
  });

  it("returns 409 for a duplicate tag name", async () => {
    const db = new FakeDb();
    const error = Object.assign(new Error("duplicate key"), { code: "23505" });
    db.queueInsertError(error);

    const response = await request(appWith(db), "/transaction-tags", {
      method: "POST",
      body: JSON.stringify({ name: "Food" }),
    });

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ error: "Tag name already exists" });
  });

  it("returns 409 when renaming to an existing name", async () => {
    const db = new FakeDb();
    const error = Object.assign(new Error("duplicate key"), { code: "23505" });
    db.queueUpdateError(error);

    const response = await request(appWith(db), "/transaction-tags/00000000-0000-4000-8000-000000000001", {
      method: "PUT",
      body: JSON.stringify({ name: "Food" }),
    });

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ error: "Tag name already exists" });
  });

  it("updates a tag owned by the caller", async () => {
    const db = new FakeDb();
    db.queueUpdate({ ...tag, name: "Meals" });

    const response = await request(appWith(db), "/transaction-tags/00000000-0000-4000-8000-000000000001", {
      method: "PUT",
      body: JSON.stringify({ name: "Meals" }),
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ...tag, name: "Meals" });
  });

  it("returns 404 when the tag is missing or owned by another user", async () => {
    const db = new FakeDb();
    db.queueUpdate();

    const response = await request(appWith(db), "/transaction-tags/00000000-0000-4000-8000-000000000001", {
      method: "PUT",
      body: JSON.stringify({ name: "Meals" }),
    });

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: "Tag not found" });
  });

  it("deletes a tag owned by the caller", async () => {
    const db = new FakeDb();
    db.queueDelete({ id: "00000000-0000-4000-8000-000000000001" });

    const response = await request(appWith(db), "/transaction-tags/00000000-0000-4000-8000-000000000001", {
      method: "DELETE",
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ success: true });
  });

  it("returns 404 when deleting a foreign tag", async () => {
    const db = new FakeDb();
    db.queueDelete();

    const response = await request(appWith(db), "/transaction-tags/00000000-0000-4000-8000-000000000001", {
      method: "DELETE",
    });

    expect(response.status).toBe(404);
  });
});

describe("transaction tag associations", () => {
  it("lists tags for an owned transaction", async () => {
    const db = new FakeDb();
    db.queueSelect({ id: "tx-1" });
    db.queueSelect({ tag });

    const response = await request(appWith(db), "/transactions/tx-1/tags");

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([tag]);
  });

  it("adds an owned tag to an owned transaction", async () => {
    const db = new FakeDb();
    db.queueSelect({ id: "tx-1" });
    db.queueSelect({ id: "00000000-0000-4000-8000-000000000001" });
    db.queueInsert();

    const response = await request(appWith(db), "/transactions/tx-1/tags", {
      method: "POST",
      body: JSON.stringify({ tag_id: "00000000-0000-4000-8000-000000000001" }),
    });

    expect(response.status).toBe(201);
    expect(db.insertCalls).toBe(1);
  });

  it("returns 404 for a foreign transaction and creates nothing", async () => {
    const db = new FakeDb();
    db.queueSelect();

    const response = await request(appWith(db), "/transactions/tx-1/tags", {
      method: "POST",
      body: JSON.stringify({ tag_id: "00000000-0000-4000-8000-000000000001" }),
    });

    expect(response.status).toBe(404);
    expect(db.insertCalls).toBe(0);
  });

  it("returns 404 for a foreign tag and creates nothing", async () => {
    const db = new FakeDb();
    db.queueSelect({ id: "tx-1" });
    db.queueSelect();

    const response = await request(appWith(db), "/transactions/tx-1/tags", {
      method: "POST",
      body: JSON.stringify({ tag_id: "00000000-0000-4000-8000-000000000001" }),
    });

    expect(response.status).toBe(404);
    expect(db.insertCalls).toBe(0);
  });

  it("removes an association after checking both owners", async () => {
    const db = new FakeDb();
    db.queueSelect({ id: "tx-1" });
    db.queueSelect({ id: "00000000-0000-4000-8000-000000000001" });
    db.queueDelete();

    const response = await request(appWith(db), "/transactions/tx-1/tags/00000000-0000-4000-8000-000000000001", {
      method: "DELETE",
    });

    expect(response.status).toBe(200);
    expect(db.deleteCalls).toBe(1);
  });

  it("returns 404 for a foreign tag on delete", async () => {
    const db = new FakeDb();
    db.queueSelect({ id: "tx-1" });
    db.queueSelect();

    const response = await request(appWith(db), "/transactions/tx-1/tags/00000000-0000-4000-8000-000000000001", {
      method: "DELETE",
    });

    expect(response.status).toBe(404);
    expect(db.deleteCalls).toBe(0);
  });
});

describe("transaction ownership", () => {
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
