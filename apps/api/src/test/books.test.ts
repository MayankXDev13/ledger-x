import { describe, expect, it } from "bun:test";
import {
  FakeDb,
  authHeaders,
  fakeWithDb,
  makeTestApp,
  requestApp,
} from "./helpers";

const book = {
  id: "book-1",
  userId: "user-1",
  name: "My Ledger",
  isDefault: true,
};

function appWith(db: FakeDb) {
  return makeTestApp({ withDb: fakeWithDb(db) });
}

describe("books", () => {
  it("creates and returns exactly one default book for a new user", async () => {
    const db = new FakeDb();
    db.queueSelect(); // no existing book
    db.queueInsert(book); // created book

    const response = await requestApp(appWith(db), "/books", {
      headers: authHeaders(),
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(book);
    expect(db.insertCalls).toBe(1);
  });

  it("returns the existing default book without creating another", async () => {
    const db = new FakeDb();
    db.queueSelect(book);

    const response = await requestApp(appWith(db), "/books", {
      headers: authHeaders(),
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(book);
    expect(db.insertCalls).toBe(0);
  });

  it("requires authentication", async () => {
    const response = await requestApp(makeTestApp(), "/books");
    expect(response.status).toBe(401);
  });
});

describe("book scoping on writes", () => {
  it("places a new customer in the user's default book", async () => {
    const db = new FakeDb();
    db.queueSelect(); // no existing book
    db.queueInsert(book); // default book
    db.queueInsert({ id: "customer-1", bookId: book.id, name: "A", phone: "1" });

    const response = await requestApp(appWith(db), "/customers", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ name: "A", phone: "1" }),
    });

    expect(response.status).toBe(201);
    expect(await response.json()).toMatchObject({ bookId: book.id });
  });

  it("ignores a client-supplied bookId and derives it from the customer", async () => {
    const db = new FakeDb();
    // Customer lookup returns the owner's book.
    db.queueSelect({ id: "customer-1", bookId: "book-owner" });
    // Inserted transaction carries the derived book.
    db.queueInsert({ id: "tx-1", bookId: "book-owner", amount: 100 });

    const response = await requestApp(appWith(db), "/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({
        customerId: "11111111-1111-4111-8111-111111111111",
        amount: 100,
        type: "credit",
        bookId: "book-owned-by-someone-else",
      }),
    });

    expect(response.status).toBe(201);
    expect(await response.json()).toMatchObject({ bookId: "book-owner" });
  });

  it("rejects a transaction for a customer that is not owned", async () => {
    const db = new FakeDb();
    db.queueSelect(); // customer lookup finds nothing

    const response = await requestApp(appWith(db), "/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({
        customerId: "11111111-1111-4111-8111-111111111111",
        amount: 100,
        type: "credit",
      }),
    });

    expect(response.status).toBe(404);
    expect(db.insertCalls).toBe(0);
  });
});
