import { describe, expect, it } from "bun:test";
import { FakeDb, authHeaders, fakeWithDb, makeTestApp, requestApp } from "./helpers";

const path = "/transactions/customers/customer-1/transactions";

function appWith(db: FakeDb) {
  return makeTestApp({ withDb: fakeWithDb(db) });
}

function request(app: ReturnType<typeof appWith>, query: string) {
  return requestApp(app, `${path}${query}`, { headers: authHeaders() });
}

describe("customer transaction summary", () => {
  it("returns whole-customer aggregates beyond the requested page", async () => {
    const db = new FakeDb();
    // Page 1 of 2: only 2 of 3 rows, but aggregates cover all 3.
    db.queueSelect(
      { id: "tx-3", amount: 80, type: "debit" },
      { id: "tx-2", amount: 700, type: "debit" },
    );
    db.queueSelect({ total: 3 });
    db.queueSelect({ totalCredit: 760, totalDebit: 1526 });
    db.queueSelect({ totalAmount: 2286 });

    const response = await request(appWith(db), "?page=1&pageSize=2");
    const body = (await response.json()) as Record<string, unknown>;

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      page: 1,
      pageSize: 2,
      total: 3,
      totalCredit: 760,
      totalDebit: 1526,
      totalAmount: 2286,
    });
    expect(body.data).toHaveLength(2);
  });

  it("computes aggregates over the active date filters", async () => {
    const db = new FakeDb();
    db.queueSelect({ id: "tx-1", amount: 349, type: "debit" });
    db.queueSelect({ total: 1 });
    db.queueSelect({ totalCredit: 0, totalDebit: 349 });
    db.queueSelect({ totalAmount: 349 });

    const response = await request(
      appWith(db),
      "?start=2026-10-27&end=2026-10-27",
    );
    const body = (await response.json()) as Record<string, unknown>;

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      total: 1,
      totalCredit: 0,
      totalDebit: 349,
      start: "2026-10-27",
      end: "2026-10-27",
    });
  });

  it("returns zeros for a customer with no transactions", async () => {
    const db = new FakeDb();
    db.queueSelect();
    db.queueSelect({ total: 0 });
    db.queueSelect({ totalCredit: 0, totalDebit: 0 });
    db.queueSelect({ totalAmount: 0 });

    const response = await request(appWith(db), "");
    const body = (await response.json()) as Record<string, unknown>;

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      data: [],
      total: 0,
      totalCredit: 0,
      totalDebit: 0,
      totalAmount: 0,
    });
  });

  it("attaches cumulative running balances to page rows", async () => {
    const db = new FakeDb();
    // Page 2 (older rows): balances reflect the whole history, not the page.
    db.queueSelect(
      { id: "tx-2", amount: 700, type: "debit", runningBalance: 696 },
      { id: "tx-1", amount: 20, type: "debit", runningBalance: -4 },
    );
    db.queueSelect({ total: 12 });
    db.queueSelect({ totalCredit: 760, totalDebit: 1526 });
    db.queueSelect({ totalAmount: 2286 });

    const response = await request(appWith(db), "?page=2&pageSize=10");
    const body = (await response.json()) as {
      data: { runningBalance: unknown }[];
    };

    expect(response.status).toBe(200);
    expect(body.data.map((row) => row.runningBalance)).toEqual([696, -4]);
  });

  it("coerces numeric-string sums to numbers", async () => {
    const db = new FakeDb();
    db.queueSelect({
      id: "tx-1",
      amount: 100,
      type: "credit",
      runningBalance: "100",
    });
    db.queueSelect({ total: 1 });
    db.queueSelect({ totalCredit: "760", totalDebit: "1526" });
    db.queueSelect({ totalAmount: "2286" });

    const response = await request(appWith(db), "");
    const body = (await response.json()) as Record<string, unknown>;

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      totalCredit: 760,
      totalDebit: 1526,
      totalAmount: 2286,
    });
    expect((body.data as { runningBalance: unknown }[])[0].runningBalance).toBe(
      100,
    );
  });
});
