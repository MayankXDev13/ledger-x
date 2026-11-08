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

function appWith(db: FakeDb) {
  return makeTestApp({ withDb: fakeWithDb(db) });
}

function queueCollection(
  db: FakeDb,
  customers: { id: string; name: string; phone: string }[],
  entries: {
    customerId: string;
    amount: number;
    type: "credit" | "debit";
    createdAt: Date;
  }[],
) {
  db.queueSelect(...customers);
  db.queueSelect(...entries);
}

describe("collection view", () => {
  it("lists only customers with a positive outstanding balance", async () => {
    const db = new FakeDb();
    queueCollection(
      db,
      [
        { id: "c1", name: "Ramesh", phone: "1" },
        { id: "c2", name: "Sunita", phone: "2" },
        { id: "c3", name: "Arjun", phone: "3" },
      ],
      [
        { customerId: "c1", amount: 1000, type: "credit", createdAt: daysAgo(45) },
        { customerId: "c2", amount: 500, type: "credit", createdAt: daysAgo(5) },
        { customerId: "c3", amount: 300, type: "credit", createdAt: daysAgo(2) },
        { customerId: "c3", amount: 300, type: "debit", createdAt: daysAgo(1) },
      ],
    );

    const response = await requestApp(appWith(db), "/collection", {
      headers: authHeaders(),
    });
    const body = (await response.json()) as {
      data: { customerId: string; outstanding: number; ageDays: number }[];
      totalReceivables: number;
    };

    expect(response.status).toBe(200);
    expect(body.data.map((row) => row.customerId)).toEqual(["c1", "c2"]);
    expect(body.totalReceivables).toBe(1500);
    expect(body.data[0].ageDays).toBeGreaterThanOrEqual(44);
  });

  it("sorts by age when requested", async () => {
    const db = new FakeDb();
    queueCollection(
      db,
      [
        { id: "c1", name: "Ramesh", phone: "1" },
        { id: "c2", name: "Sunita", phone: "2" },
      ],
      [
        { customerId: "c1", amount: 1000, type: "credit", createdAt: daysAgo(45) },
        { customerId: "c2", amount: 500, type: "credit", createdAt: daysAgo(5) },
      ],
    );

    const response = await requestApp(appWith(db), "/collection?sort=age", {
      headers: authHeaders(),
    });
    const body = (await response.json()) as {
      data: { customerId: string }[];
    };

    expect(response.status).toBe(200);
    expect(body.data.map((row) => row.customerId)).toEqual(["c1", "c2"]);
  });

  it("rejects an unknown sort option", async () => {
    const response = await requestApp(
      makeTestApp(),
      "/collection?sort=name",
      { headers: authHeaders() },
    );

    expect(response.status).toBe(400);
  });

  it("requires authentication", async () => {
    const response = await requestApp(makeTestApp(), "/collection");
    expect(response.status).toBe(401);
  });
});
