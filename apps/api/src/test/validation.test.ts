import { describe, expect, it } from "bun:test";
import { FakeDb, authHeaders, fakeWithDb, makeTestApp, requestApp } from "./helpers";

const path = "/transactions/customers/customer-1/transactions";

function appWith(db: FakeDb) {
  return makeTestApp({ withDb: fakeWithDb(db) });
}

function request(app: ReturnType<typeof appWith>, query: string) {
  return requestApp(app, `${path}${query}`, { headers: authHeaders() });
}

describe("transaction query validation", () => {
  it("rejects a non-numeric page", async () => {
    const response = await request(makeTestApp(), "?page=abc");
    const body = (await response.json()) as {
      details?: Record<string, unknown>;
    };

    expect(response.status).toBe(400);
    expect(body.details).toHaveProperty("page");
  });

  it("rejects a page below one", async () => {
    const response = await request(makeTestApp(), "?page=0");
    const body = (await response.json()) as {
      details?: Record<string, unknown>;
    };

    expect(response.status).toBe(400);
    expect(body.details).toHaveProperty("page");
  });

  it("bounds the page size", async () => {
    const response = await request(makeTestApp(), "?pageSize=1000");
    const body = (await response.json()) as {
      details?: Record<string, unknown>;
    };

    expect(response.status).toBe(400);
    expect(body.details).toHaveProperty("pageSize");
  });

  it("rejects an invalid date", async () => {
    const response = await request(makeTestApp(), "?start=not-a-date");
    const body = (await response.json()) as {
      details?: Record<string, unknown>;
    };

    expect(response.status).toBe(400);
    expect(body.details).toHaveProperty("start");
  });

  it("rejects a reversed date range", async () => {
    const response = await request(
      makeTestApp(),
      "?start=2026-02-01&end=2026-01-01",
    );
    const body = (await response.json()) as {
      details?: Record<string, unknown>;
    };

    expect(response.status).toBe(400);
    expect(body.details).toHaveProperty("start");
  });

  it("applies valid filters and returns page metadata", async () => {
    const db = new FakeDb();
    const transaction = { id: "tx-1", amount: 100, type: "credit" };
    db.queueSelect(transaction);
    db.queueSelect({ total: 1 });
    db.queueSelect({ totalCredit: 100, totalDebit: 0 });
    db.queueSelect({ totalAmount: 100 });

    const response = await request(
      appWith(db),
      "?page=2&pageSize=5&start=2026-01-01&end=2026-01-31",
    );
    const body = (await response.json()) as {
      details?: Record<string, unknown>;
    };

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      data: [transaction],
      page: 2,
      pageSize: 5,
      total: 1,
      totalCredit: 100,
      totalDebit: 0,
      totalAmount: 100,
      start: "2026-01-01",
      end: "2026-01-31",
    });
  });
});

describe("transaction amount validation", () => {
  const customerId = "11111111-1111-4111-8111-111111111111";

  function postAmount(amount: number) {
    return requestApp(makeTestApp(), "/transactions", {
      method: "POST",
      headers: { ...authHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({ customerId, amount, type: "credit" }),
    });
  }

  it("rejects a fractional rupee amount and names the unit", async () => {
    const response = await postAmount(1250.5);
    const body = (await response.json()) as {
      error?: string;
      details?: Record<string, string[] | undefined>;
    };

    expect(response.status).toBe(400);
    expect(body.error).toBe("Validation failed");
    expect(body.details?.amount?.[0]).toBe(
      "amount must be a whole number of rupees",
    );
  });

  it("rejects a zero amount", async () => {
    const response = await postAmount(0);
    const body = (await response.json()) as {
      details?: Record<string, string[] | undefined>;
    };

    expect(response.status).toBe(400);
    expect(body.details?.amount?.[0]).toBe(
      "amount must be a positive number of rupees",
    );
  });

  it("rejects a negative amount", async () => {
    const response = await postAmount(-500);
    const body = (await response.json()) as {
      details?: Record<string, string[] | undefined>;
    };

    expect(response.status).toBe(400);
    expect(body.details?.amount?.[0]).toBe(
      "amount must be a positive number of rupees",
    );
  });
});
