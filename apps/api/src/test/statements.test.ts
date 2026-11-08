import { describe, expect, it } from "bun:test";
import {
  FakeDb,
  authHeaders,
  fakeWithDb,
  makeTestApp,
  requestApp,
} from "./helpers";

const customerId = "11111111-1111-4111-8111-111111111111";
const path = `/statements/customers/${customerId}`;

function appWith(db: FakeDb) {
  return makeTestApp({ withDb: fakeWithDb(db) });
}

const customer = { id: customerId, name: "Ramesh", phone: "900" };

describe("customer statements", () => {
  it("builds a full-history statement with running balances", async () => {
    const db = new FakeDb();
    db.queueSelect(customer);
    db.queueSelect(
      {
        id: "t1",
        type: "credit",
        amount: 1000,
        paymentMethod: null,
        note: null,
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
      },
      {
        id: "t2",
        type: "debit",
        amount: 400,
        paymentMethod: "cash",
        note: "part payment",
        createdAt: new Date("2026-01-02T00:00:00.000Z"),
      },
    );

    const response = await requestApp(appWith(db), path, {
      headers: authHeaders(),
    });
    const body = (await response.json()) as {
      openingBalance: number;
      closingBalance: number;
      totalCredit: number;
      totalDebit: number;
      entries: { runningBalance: number; paymentMethod: string | null }[];
    };

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      openingBalance: 0,
      closingBalance: 600,
      totalCredit: 1000,
      totalDebit: 400,
    });
    expect(body.entries.map((entry) => entry.runningBalance)).toEqual([
      1000, 600,
    ]);
    expect(body.entries[1].paymentMethod).toBe("cash");
  });

  it("carries an opening balance for a partial range", async () => {
    const db = new FakeDb();
    db.queueSelect(customer);
    db.queueSelect(
      {
        id: "t1",
        type: "credit",
        amount: 1000,
        paymentMethod: null,
        note: null,
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
      },
      {
        id: "t2",
        type: "debit",
        amount: 400,
        paymentMethod: "cash",
        note: null,
        createdAt: new Date("2026-02-01T00:00:00.000Z"),
      },
      {
        id: "t3",
        type: "credit",
        amount: 200,
        paymentMethod: null,
        note: null,
        createdAt: new Date("2026-03-01T00:00:00.000Z"),
      },
    );

    const response = await requestApp(
      appWith(db),
      `${path}?start=2026-02-01&end=2026-02-28`,
      { headers: authHeaders() },
    );
    const body = (await response.json()) as {
      openingBalance: number;
      closingBalance: number;
      entries: unknown[];
    };

    expect(response.status).toBe(200);
    expect(body.openingBalance).toBe(1000);
    expect(body.closingBalance).toBe(600);
    expect(body.entries).toHaveLength(1);
  });

  it("rejects an invalid date range", async () => {
    const response = await requestApp(
      makeTestApp(),
      `${path}?start=2026-03-01&end=2026-01-01`,
      { headers: authHeaders() },
    );

    expect(response.status).toBe(400);
  });

  it("returns 404 for another user's customer", async () => {
    const db = new FakeDb();
    db.queueSelect(); // customer lookup finds nothing

    const response = await requestApp(appWith(db), path, {
      headers: authHeaders(),
    });

    expect(response.status).toBe(404);
  });
});
