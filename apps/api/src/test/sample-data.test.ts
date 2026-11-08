import { describe, expect, it } from "bun:test";
import {
  FakeDb,
  authHeaders,
  fakeWithDb,
  makeTestApp,
  requestApp,
} from "./helpers";

function appWith(db: FakeDb) {
  return makeTestApp({ withDb: fakeWithDb(db) });
}

describe("sample data", () => {
  it("seeds labeled sample customers and entries", async () => {
    const db = new FakeDb();
    db.queueSelect(); // book lookup
    db.queueInsert({ id: "book-1", userId: "user-1", isDefault: true });
    db.queueInsert(
      { id: "c1", isSample: true },
      { id: "c2", isSample: true },
      { id: "c3", isSample: true },
    );
    db.queueInsert({ id: "t1" }, { id: "t2" }, { id: "t3" }, { id: "t4" }, { id: "t5" }, { id: "t6" });

    const response = await requestApp(appWith(db), "/sample-data", {
      method: "POST",
      headers: authHeaders(),
    });
    const body = (await response.json()) as {
      customers: { isSample: boolean }[];
      transactions: unknown[];
    };

    expect(response.status).toBe(201);
    expect(body.customers).toHaveLength(3);
    expect(body.customers.every((customer) => customer.isSample)).toBe(true);
    expect(body.transactions).toHaveLength(6);
  });

  it("removes only sample records", async () => {
    const db = new FakeDb();
    db.queueDelete();
    db.queueDelete();

    const response = await requestApp(appWith(db), "/sample-data", {
      method: "DELETE",
      headers: authHeaders(),
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ success: true });
    expect(db.deleteCalls).toBe(2);
  });

  it("requires authentication", async () => {
    const response = await requestApp(makeTestApp(), "/sample-data", {
      method: "POST",
    });
    expect(response.status).toBe(401);
  });
});
