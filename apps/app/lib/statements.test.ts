import { describe, expect, it } from "bun:test";
import {
  formatMoney,
  renderStatementHtml,
  statementFileName,
} from "./statements";
import type { Statement } from "./api";

const statement: Statement = {
  customer: { id: "c1", name: "Ramesh Kumar", phone: "+91 99999 00001" },
  start: "2026-01-01T00:00:00.000Z",
  end: "2026-01-31T23:59:59.999Z",
  openingBalance: 500,
  closingBalance: 1300,
  totalCredit: 1000,
  totalDebit: 200,
  entries: [
    {
      id: "t1",
      date: "2026-01-05T10:00:00.000Z",
      type: "credit",
      amount: 1000,
      paymentMethod: null,
      note: "Goods",
      runningBalance: 1500,
    },
    {
      id: "t2",
      date: "2026-01-10T10:00:00.000Z",
      type: "debit",
      amount: 200,
      paymentMethod: "upi",
      note: null,
      runningBalance: 1300,
    },
  ],
};

describe("statementFileName", () => {
  it("follows slug-start_end.pdf naming", () => {
    expect(
      statementFileName(
        "Ramesh Kumar",
        "2026-01-01T00:00:00.000Z",
        "2026-01-31T00:00:00.000Z",
      ),
    ).toBe("ramesh-kumar-statement-2026-01-01_2026-01-31.pdf");
  });

  it("falls back to all-time for open periods", () => {
    expect(statementFileName("Ramesh Kumar", null, null)).toBe(
      "ramesh-kumar-statement-all-time_all-time.pdf",
    );
  });

  it("slugifies punctuation and caps length", () => {
    expect(statementFileName("A Very Long Customer Name!! & Co", null, null)).toBe(
      "a-very-long-customer-name-co-statement-all-time_all-time.pdf",
    );
  });
});

describe("renderStatementHtml", () => {
  const html = renderStatementHtml(statement, { businessName: "Ramesh Kirana" });

  it("renders the period, customer, and totals", () => {
    expect(html).toContain("Ramesh Kirana");
    expect(html).toContain("Ramesh Kumar");
    expect(html).toContain("+91 99999 00001");
    expect(html).toContain(formatMoney(500));
    expect(html).toContain(formatMoney(1300));
  });

  it("renders entries with running balances and the payment badge", () => {
    expect(html).toContain(formatMoney(1000));
    expect(html).toContain(formatMoney(200));
    expect(html).toContain(formatMoney(1500));
    expect(html).toContain("UPI");
  });

  it("escapes HTML in user-provided text", () => {
    const hostile: Statement = {
      ...statement,
      customer: { id: "c1", name: "<script>alert(1)</script>", phone: "x" },
      entries: [],
    };
    const safe = renderStatementHtml(hostile);
    expect(safe).not.toContain("<script>");
    expect(safe).toContain("No transactions in this period.");
  });
});

describe("formatMoney", () => {
  it("always shows two decimals in whole rupees", () => {
    expect(formatMoney(1250)).toContain("1,250.00");
    expect(formatMoney(0)).toContain("0.00");
  });
});
