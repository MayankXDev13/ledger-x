import { describe, expect, it } from "bun:test";
import {
  FakeDb,
  authHeaders,
  fakeWithDb,
  makeTestApp,
  requestApp,
} from "./helpers";

const DAY = 24 * 60 * 60 * 1000;

function daysAgo(days: number): Date {
  return new Date(Date.now() - days * DAY);
}

function currentMonthKey(): string {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
}

function appWith(db: FakeDb) {
  return makeTestApp({ withDb: fakeWithDb(db) });
}

describe("dashboard analytics", () => {
  function seed(db: FakeDb) {
    db.queueSelect(
      { id: "c1", name: "Ramesh" },
      { id: "c2", name: "Sunita" },
      { id: "c3", name: "Arjun" },
    );
    db.queueSelect(
      { customerId: "c1", amount: 1000, type: "credit", createdAt: daysAgo(45) },
      { customerId: "c2", amount: 500, type: "credit", createdAt: daysAgo(1) },
      { customerId: "c3", amount: 300, type: "credit", createdAt: daysAgo(2) },
      { customerId: "c3", amount: 300, type: "debit", createdAt: daysAgo(1) },
    );
  }

  it("returns twelve monthly points with zero-filled months", async () => {
    const db = new FakeDb();
    seed(db);

    const response = await requestApp(appWith(db), "/dashboard/analytics", {
      headers: authHeaders(),
    });
    const body = (await response.json()) as {
      trend: { month: string; credit: number; debit: number }[];
    };

    expect(response.status).toBe(200);
    expect(body.trend).toHaveLength(12);
    expect(body.trend.at(-1)?.month).toBe(currentMonthKey());
    expect(body.trend.some((point) => point.credit === 0 && point.debit === 0)).toBe(true);
  });

  it("orders top debtors by outstanding balance", async () => {
    const db = new FakeDb();
    seed(db);

    const response = await requestApp(appWith(db), "/dashboard/analytics", {
      headers: authHeaders(),
    });
    const body = (await response.json()) as {
      topDebtors: { customerId: string; outstanding: number }[];
    };

    expect(body.topDebtors.map((debtor) => debtor.customerId)).toEqual([
      "c1",
      "c2",
    ]);
  });

  it("buckets receivables and reports their total", async () => {
    const db = new FakeDb();
    seed(db);

    const response = await requestApp(appWith(db), "/dashboard/analytics", {
      headers: authHeaders(),
    });
    const body = (await response.json()) as {
      aging: Record<string, number>;
      totalReceivables: number;
    };

    expect(body.aging["31-60"]).toBe(1000);
    expect(body.aging["0-30"]).toBe(500);
    expect(body.aging["60+"]).toBe(0);
    expect(body.totalReceivables).toBe(1500);
  });

  it("requires authentication", async () => {
    const response = await requestApp(makeTestApp(), "/dashboard/analytics");
    expect(response.status).toBe(401);
  });
});
