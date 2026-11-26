import { describe, expect, it } from "bun:test";
import { FakeDb, authHeaders, fakeWithDb, makeTestApp, requestApp } from "./helpers";

describe("authenticated ledger GET Cache-Control", () => {
  it("sets Cache-Control: no-store on customer transactions GET", async () => {
    const db = new FakeDb();
    db.queueSelect();
    db.queueSelect({ total: 0 });
    db.queueSelect({ totalCredit: 0, totalDebit: 0 });
    db.queueSelect({ totalAmount: 0 });

    const app = makeTestApp({ withDb: fakeWithDb(db) });
    const res = await requestApp(
      app,
      "/transactions/customers/customer-1/transactions",
      { headers: authHeaders() },
    );

    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toBe("no-store");
  });

  it("sets Cache-Control: no-store on customer balances GET", async () => {
    const db = new FakeDb();
    db.queueSelect({ id: "customer-1" });
    db.queueSelect();

    const app = makeTestApp({ withDb: fakeWithDb(db) });
    const res = await requestApp(app, "/customers/balances", {
      headers: authHeaders(),
    });

    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toBe("no-store");
  });

  it("sets Cache-Control: no-store on dashboard metrics GET", async () => {
    const db = new FakeDb();
    db.queueSelect({ count: 1 });
    db.queueSelect({ totalCredit: 500, totalDebit: 200 });
    db.queueSelect({ monthCredit: 500, monthDebit: 200 });

    const app = makeTestApp({ withDb: fakeWithDb(db) });
    const res = await requestApp(app, "/dashboard/metrics", {
      headers: authHeaders(),
    });

    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toBe("no-store");
  });
});
