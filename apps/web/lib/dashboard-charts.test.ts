import { describe, expect, it } from "bun:test";
import type { Transaction } from "./api";
import { buildRecentChartData } from "./dashboard-charts";
import { formatSignedCompactCurrency } from "./format";

function tx(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: "tx-1",
    userId: "u-1",
    customerId: "c-1",
    amount: 500,
    type: "credit",
    paymentMethod: null,
    createdAt: "2026-11-26T10:00:00.000Z",
    ...overrides,
  };
}

describe("buildRecentChartData", () => {
  it("disambiguates X-axis labels when multiple transactions happen on the same day", () => {
    const data = buildRecentChartData(
      [
        tx({ id: "tx-3", createdAt: "2026-11-26T10:00:00.000Z" }),
        tx({ id: "tx-2", createdAt: "2026-11-26T10:00:00.000Z" }),
        tx({ id: "tx-1", createdAt: "2026-11-26T09:15:00.000Z" }),
      ],
      [{ id: "c-1", userId: "u-1", name: "Ramesh", phone: "9999999999" }],
    );

    const names = data.map((d) => d.name);
    expect(new Set(names).size).toBe(3);
    expect(data[0].tooltipLabel).toContain("Ramesh · ");
  });

  it("classifies debit without paymentMethod as Payment received, not Credit", () => {
    const data = buildRecentChartData([
      tx({ id: "tx-1", type: "debit", amount: 300, paymentMethod: null }),
    ]);

    expect(data[0].type).toBe("debit");
    expect(data[0].amount).toBe(-300);
    expect(data[0].sign).toBe("−");
    expect(data[0].typeLabel).toBe("Payment received");
  });
});

describe("formatSignedCompactCurrency", () => {
  it("preserves minus signs for negative values and leaves positive/zero unsigned", () => {
    expect(formatSignedCompactCurrency(-500)).toBe("−₹500");
    expect(formatSignedCompactCurrency(-2000)).toBe("−₹2k");
    expect(formatSignedCompactCurrency(0)).toBe("₹0");
    expect(formatSignedCompactCurrency(1500)).toBe("₹2k");
  });
});
