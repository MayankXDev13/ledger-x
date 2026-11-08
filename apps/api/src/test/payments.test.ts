import { describe, expect, it } from "bun:test";
import {
  FakeDb,
  authHeaders,
  fakeWithDb,
  makeTestApp,
  requestApp,
} from "./helpers";

const customerId = "11111111-1111-4111-8111-111111111111";
const transactionId = "22222222-2222-4222-8222-222222222222";

function appWith(db: FakeDb) {
  return makeTestApp({ withDb: fakeWithDb(db) });
}

function postTransaction(db: FakeDb, body: Record<string, unknown>) {
  return requestApp(appWith(db), "/transactions", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(body),
  });
}

describe("payment recording (API)", () => {
  it("persists a valid payment method", async () => {
    const db = new FakeDb();
    db.queueSelect({ id: customerId, bookId: "book-1" });
    db.queueInsert({
      id: transactionId,
      amount: 400,
      type: "debit",
      paymentMethod: "upi",
    });

    const response = await postTransaction(db, {
      customerId,
      amount: 400,
      type: "debit",
      paymentMethod: "upi",
    });

    expect(response.status).toBe(201);
    expect(await response.json()).toMatchObject({
      amount: 400,
      type: "debit",
      paymentMethod: "upi",
    });
  });

  it("accepts a transaction without a payment method", async () => {
    const db = new FakeDb();
    db.queueSelect({ id: customerId, bookId: "book-1" });
    db.queueInsert({ id: transactionId, amount: 100, type: "credit" });

    const response = await postTransaction(db, {
      customerId,
      amount: 100,
      type: "credit",
    });

    expect(response.status).toBe(201);
    expect(db.insertCalls).toBe(1);
  });

  it("rejects an unknown payment method with field details", async () => {
    const db = new FakeDb();

    const response = await postTransaction(db, {
      customerId,
      amount: 100,
      type: "debit",
      paymentMethod: "card",
    });
    const body = (await response.json()) as { details?: Record<string, unknown> };

    expect(response.status).toBe(400);
    expect(body.details).toHaveProperty("paymentMethod");
    expect(db.insertCalls).toBe(0);
  });

  it("returns a null payment method for legacy entries", async () => {
    const db = new FakeDb();
    db.queueSelect({
      id: transactionId,
      amount: 100,
      type: "credit",
      paymentMethod: null,
    });

    const response = await requestApp(appWith(db), `/transactions/${transactionId}`, {
      headers: authHeaders(),
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ paymentMethod: null });
  });

  it("includes payments in the debit aggregate", async () => {
    const db = new FakeDb();
    // One credit of 1000 and one partial payment (debit) of 400.
    db.queueSelect();
    db.queueSelect({ total: 2 });
    db.queueSelect({ totalCredit: 1000, totalDebit: 400 });
    db.queueSelect({ totalAmount: 1400 });

    const response = await requestApp(
      appWith(db),
      `/transactions/customers/${customerId}/transactions`,
      { headers: authHeaders() },
    );
    const body = (await response.json()) as Record<string, number>;

    expect(response.status).toBe(200);
    expect(body.totalCredit - body.totalDebit).toBe(600);
  });
});
