import { describe, expect, it } from "bun:test";
import { csvEscape, formatAmount, isExportable, toCsv } from "../lib/csv";
import {
  FakeDb,
  authHeaders,
  fakeWithDb,
  makeTestApp,
  requestApp,
} from "./helpers";

describe("CSV helpers", () => {
  it("formats amounts with two decimals in whole currency units", () => {
    expect(formatAmount(1250)).toBe("1250.00");
    expect(formatAmount(5)).toBe("5.00");
    expect(formatAmount(100000)).toBe("100000.00");
  });

  it("quotes fields containing delimiters and quotes", () => {
    expect(csvEscape("plain")).toBe("plain");
    expect(csvEscape('say "hi"')).toBe('"say ""hi"""');
    expect(csvEscape("a,b")).toBe('"a,b"');
    expect(csvEscape("line\nbreak")).toBe('"line\nbreak"');
  });

  it("joins rows with a header and CRLF", () => {
    expect(toCsv(["a", "b"], [[1, 2]])).toBe("a,b\r\n1,2\r\n");
  });
});

describe("isExportable (sample-data exclusion)", () => {
  it("excludes sample rows from CSV exports and the archive", () => {
    expect(isExportable({ isSample: true, deletedAt: null })).toBe(false);
    expect(isExportable({ isSample: false, deletedAt: null })).toBe(true);
    expect(isExportable({ isSample: null, deletedAt: null })).toBe(true);
  });

  it("excludes soft-deleted rows from CSV but keeps them in the archive", () => {
    const deleted = { isSample: false, deletedAt: new Date() };
    expect(isExportable(deleted)).toBe(false);
    expect(isExportable(deleted, { includeDeleted: true })).toBe(true);
  });

  it("never exports a sample row even when flagged deleted", () => {
    expect(
      isExportable({ isSample: true, deletedAt: new Date() }, { includeDeleted: true }),
    ).toBe(false);
  });
});

describe("export endpoints exclude sample rows", () => {
  it("customers.csv omits rows flagged is_sample", async () => {
    const db = new FakeDb();
    // The FakeDb returns queued rows verbatim; the in-memory guard must drop
    // the sample row before serialization.
    db.queueSelect(
      {
        id: "c1",
        name: "Ramesh",
        phone: "900",
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
        updatedAt: new Date("2026-01-01T00:00:00.000Z"),
      },
      {
        id: "c-sample",
        name: "Sample Customer",
        phone: "901",
        isSample: true,
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
        updatedAt: new Date("2026-01-01T00:00:00.000Z"),
      },
    );

    const response = await requestApp(appWith(db), "/exports/customers.csv", {
      headers: authHeaders(),
    });
    const body = await response.text();

    expect(response.status).toBe(200);
    expect(body).toContain("c1,Ramesh");
    expect(body).not.toContain("c-sample");
    expect(body).not.toContain("Sample Customer");
  });

  it("transactions.csv omits sample transactions", async () => {
    const db = new FakeDb();
    db.queueSelect(
      {
        id: "t1",
        customerId: "c1",
        type: "credit",
        amount: 500,
        paymentMethod: null,
        note: null,
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
        updatedAt: new Date("2026-01-01T00:00:00.000Z"),
      },
      {
        id: "t-sample",
        customerId: "c1",
        type: "credit",
        amount: 999,
        isSample: true,
        note: null,
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
        updatedAt: new Date("2026-01-01T00:00:00.000Z"),
      },
    );
    db.queueSelect({ id: "c1", name: "Ramesh" });

    const response = await requestApp(
      appWith(db),
      "/exports/transactions.csv",
      { headers: authHeaders() },
    );
    const body = await response.text();

    expect(response.status).toBe(200);
    expect(body).toContain("t1,c1,Ramesh,credit,500.00");
    expect(body).not.toContain("t-sample");
    expect(body).not.toContain("999.00");
  });

  it("the account archive flags deleted rows but still excludes samples", async () => {
    const db = new FakeDb();
    db.queueSelect(
      {
        id: "c1",
        name: "Ramesh",
        phone: "900",
        deletedAt: null,
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
      },
      {
        id: "c-deleted",
        name: "Old Customer",
        phone: "902",
        deletedAt: new Date("2026-01-05T00:00:00.000Z"),
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
      },
      {
        id: "c-sample",
        name: "Sample Customer",
        phone: "901",
        isSample: true,
        deletedAt: null,
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
      },
    );
    db.queueSelect();

    const response = await requestApp(appWith(db), "/account/export", {
      headers: authHeaders(),
    });
    const archive = (await response.json()) as {
      customers: { id: string; deleted: boolean }[];
    };

    expect(archive.customers.map((c) => c.id)).toEqual(["c1", "c-deleted"]);
    expect(
      archive.customers.find((c) => c.id === "c-deleted")?.deleted,
    ).toBe(true);
  });
});

function appWith(db: FakeDb) {
  return makeTestApp({ withDb: fakeWithDb(db) });
}

describe("export endpoints", () => {
  it("requires authentication", async () => {
    const response = await requestApp(makeTestApp(), "/exports/customers.csv");
    expect(response.status).toBe(401);
  });

  it("returns customers as CSV", async () => {
    const db = new FakeDb();
    db.queueSelect({
      id: "c1",
      name: "Ramesh, Kirana",
      phone: "900",
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      updatedAt: new Date("2026-01-02T00:00:00.000Z"),
    });

    const response = await requestApp(appWith(db), "/exports/customers.csv", {
      headers: authHeaders(),
    });
    const body = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/csv");
    expect(response.headers.get("content-disposition")).toContain(
      "ledger-x-customers-",
    );
    expect(body.split("\r\n")[0]).toBe(
      "id,name,phone,created_at,updated_at",
    );
    expect(body).toContain('"Ramesh, Kirana"');
  });

  it("returns transactions with a customer reference and formatted amount", async () => {
    const db = new FakeDb();
    db.queueSelect({
      id: "t1",
      customerId: "c1",
      type: "debit",
      amount: 1250,
      paymentMethod: "upi",
      note: null,
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    });
    db.queueSelect({ id: "c1", name: "Ramesh" });

    const response = await requestApp(
      appWith(db),
      "/exports/transactions.csv",
      { headers: authHeaders() },
    );
    const body = await response.text();

    expect(response.status).toBe(200);
    expect(body).toContain("customer_id,customer_name");
    expect(body).toContain("t1,c1,Ramesh,debit,1250.00,upi");
  });
});
