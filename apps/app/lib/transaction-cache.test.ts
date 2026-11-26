import { describe, expect, it } from "bun:test";
import type { InfiniteData } from "@tanstack/react-query";
import type { PagedTransactions, Transaction } from "./api";
import {
  applyBalanceDelta,
  applyCreatedTransactionToInfinite,
  applyDeletedTransactionToInfinite,
  applyTransactionToDashboardAnalytics,
  applyTransactionToDashboardMetrics,
  applyUpdatedTransactionToInfinite,
} from "./transaction-cache";

function makeTx(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: "tx-1",
    userId: "u-1",
    customerId: "c-1",
    amount: 500,
    type: "credit",
    createdAt: "2026-11-26T10:00:00.000Z",
    runningBalance: 500,
    ...overrides,
  };
}

function makeInfinite(data: Transaction[]): InfiniteData<PagedTransactions> {
  const totalCredit = data
    .filter((t) => t.type === "credit")
    .reduce((sum, t) => sum + t.amount, 0);
  const totalDebit = data
    .filter((t) => t.type === "debit")
    .reduce((sum, t) => sum + t.amount, 0);

  return {
    pageParams: [1],
    pages: [
      {
        data,
        page: 1,
        pageSize: 10,
        total: data.length,
        totalCredit,
        totalDebit,
        totalAmount: totalCredit + totalDebit,
      },
    ],
  };
}

describe("mobile transaction cache helpers", () => {
  it("prepends created transaction and updates page-0 totals", () => {
    const existing = makeInfinite([makeTx({ id: "tx-1", amount: 500 })]);
    const next = applyCreatedTransactionToInfinite(
      existing,
      makeTx({ id: "tx-2", amount: 200, type: "debit", runningBalance: undefined }),
    );
    expect(next?.pages[0].data.map((t) => t.id)).toEqual(["tx-2", "tx-1"]);
    expect(next?.pages[0].data[0].runningBalance).toBe(300);
    expect(next?.pages[0].totalCredit).toBe(500);
    expect(next?.pages[0].totalDebit).toBe(200);
  });

  it("updates and deletes transactions cleanly in infinite cache", () => {
    const existing = makeInfinite([makeTx({ id: "tx-1", amount: 500 })]);
    const updated = applyUpdatedTransactionToInfinite(
      existing,
      makeTx({ id: "tx-1", amount: 300, type: "debit", runningBalance: undefined }),
    );
    expect(updated.balanceDelta).toBe(-800);
    expect(updated.next?.pages[0].totalDebit).toBe(300);

    const deleted = applyDeletedTransactionToInfinite(updated.next, "tx-1");
    expect(deleted.removed?.id).toBe("tx-1");
    expect(deleted.next?.pages[0].data).toHaveLength(0);
    expect(deleted.next?.pages[0].totalDebit).toBe(0);
  });

  it("patches balances, dashboard metrics, and analytics", () => {
    const balances = applyBalanceDelta(
      { "c-1": { outstanding: 500, ageDays: 4 } },
      "c-1",
      -200,
    );
    expect(balances?.["c-1"]).toEqual({ outstanding: 300, ageDays: 4 });

    const now = new Date("2026-11-26T10:00:00.000Z");
    const metrics = applyTransactionToDashboardMetrics(
      { totalBalance: 500, totalCustomers: 1, monthlyNet: 500 },
      -200,
      "2026-11-26T09:00:00.000Z",
      now,
    );
    expect(metrics).toEqual({
      totalBalance: 300,
      totalCustomers: 1,
      monthlyNet: 300,
    });

    const analytics = applyTransactionToDashboardAnalytics(
      {
        trend: [{ month: "2026-11", credit: 500, debit: 0 }],
        topDebtors: [
          { customerId: "c-1", name: "Ramesh", outstanding: 500, ageDays: 4 },
        ],
        aging: { "0-30": 500, "31-60": 0, "60+": 0 },
        totalReceivables: 500,
      },
      {
        customerId: "c-1",
        creditDelta: 0,
        debitDelta: 200,
        createdAt: "2026-11-26T09:00:00.000Z",
        previousCustomerOutstanding: 500,
      },
      now,
    );
    expect(analytics?.totalReceivables).toBe(300);
    expect(analytics?.trend[0].debit).toBe(200);
  });
});
