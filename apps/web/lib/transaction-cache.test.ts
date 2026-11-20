import { describe, expect, it } from "bun:test";
import type { InfiniteData } from "@tanstack/react-query";
import type { PagedTransactions, Transaction } from "./api";
import {
  applyBalanceDelta,
  applyCreatedTransactionToInfinite,
  applyDeletedTransactionToInfinite,
  applyUpdatedTransactionToInfinite,
} from "./transaction-cache";

function makeTx(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: "tx-1",
    userId: "u-1",
    customerId: "c-1",
    amount: 500,
    type: "credit",
    note: "Initial",
    createdAt: "2026-11-20T10:00:00.000Z",
    runningBalance: 500,
    ...overrides,
  };
}

function makeInfinite(
  data: Transaction[],
  totals: { total?: number; totalCredit?: number; totalDebit?: number } = {},
): InfiniteData<PagedTransactions> {
  const totalCredit =
    totals.totalCredit ??
    data
      .filter((t) => t.type === "credit")
      .reduce((sum, t) => sum + t.amount, 0);
  const totalDebit =
    totals.totalDebit ??
    data
      .filter((t) => t.type === "debit")
      .reduce((sum, t) => sum + t.amount, 0);

  return {
    pageParams: [1],
    pages: [
      {
        data,
        page: 1,
        pageSize: 10,
        total: totals.total ?? data.length,
        totalCredit,
        totalDebit,
        totalAmount: totalCredit + totalDebit,
      },
    ],
  };
}

describe("applyCreatedTransactionToInfinite", () => {
  it("prepends a new credit and updates totals and running balance", () => {
    const existing = makeInfinite([makeTx({ id: "tx-1", amount: 500, type: "credit" })]);
    const created = makeTx({
      id: "tx-2",
      amount: 250,
      type: "credit",
      runningBalance: undefined,
    });

    const next = applyCreatedTransactionToInfinite(existing, created);
    expect(next?.pages[0].data.map((t) => t.id)).toEqual(["tx-2", "tx-1"]);
    expect(next?.pages[0].data[0].runningBalance).toBe(750);
    expect(next?.pages[0].total).toBe(2);
    expect(next?.pages[0].totalCredit).toBe(750);
    expect(next?.pages[0].totalDebit).toBe(0);
    expect(next?.pages[0].totalAmount).toBe(750);
  });

  it("prepends a new debit and subtracts from running balance", () => {
    const existing = makeInfinite([makeTx({ id: "tx-1", amount: 500, type: "credit" })]);
    const created = makeTx({
      id: "tx-2",
      amount: 200,
      type: "debit",
      runningBalance: undefined,
    });

    const next = applyCreatedTransactionToInfinite(existing, created);
    expect(next?.pages[0].data[0].runningBalance).toBe(300);
    expect(next?.pages[0].totalCredit).toBe(500);
    expect(next?.pages[0].totalDebit).toBe(200);
    expect(next?.pages[0].total).toBe(2);
  });

  it("does not duplicate a transaction already present in page 0", () => {
    const tx = makeTx({ id: "tx-1" });
    const existing = makeInfinite([tx]);
    const next = applyCreatedTransactionToInfinite(existing, tx);
    expect(next).toBe(existing);
  });
});

describe("applyUpdatedTransactionToInfinite", () => {
  it("patches the transaction and adjusts totals when type and amount change", () => {
    const existing = makeInfinite([
      makeTx({ id: "tx-1", amount: 500, type: "credit", runningBalance: 500 }),
    ]);
    const updated = makeTx({
      id: "tx-1",
      amount: 300,
      type: "debit",
      note: "Updated",
      runningBalance: undefined,
    });

    const { next, balanceDelta } = applyUpdatedTransactionToInfinite(existing, updated);
    expect(balanceDelta).toBe(-800);
    expect(next?.pages[0].data[0].note).toBe("Updated");
    expect(next?.pages[0].totalCredit).toBe(0);
    expect(next?.pages[0].totalDebit).toBe(300);
    expect(next?.pages[0].totalAmount).toBe(300);
  });
});

describe("applyDeletedTransactionToInfinite", () => {
  it("removes the deleted transaction and decrements totals", () => {
    const existing = makeInfinite([
      makeTx({ id: "tx-2", amount: 200, type: "debit", runningBalance: 300 }),
      makeTx({ id: "tx-1", amount: 500, type: "credit", runningBalance: 500 }),
    ]);

    const { next, removed } = applyDeletedTransactionToInfinite(existing, "tx-2");
    expect(removed?.id).toBe("tx-2");
    expect(next?.pages[0].data.map((t) => t.id)).toEqual(["tx-1"]);
    expect(next?.pages[0].total).toBe(1);
    expect(next?.pages[0].totalCredit).toBe(500);
    expect(next?.pages[0].totalDebit).toBe(0);
  });
});

describe("applyBalanceDelta", () => {
  it("updates outstanding balance and sets ageDays to 0 when transitioning from settled", () => {
    const next = applyBalanceDelta(
      { "c-1": { outstanding: 0, ageDays: null } },
      "c-1",
      400,
    );
    expect(next?.["c-1"]).toEqual({ outstanding: 400, ageDays: 0 });
  });

  it("clears ageDays when balance settles to zero or negative", () => {
    const next = applyBalanceDelta(
      { "c-1": { outstanding: 400, ageDays: 12 } },
      "c-1",
      -400,
    );
    expect(next?.["c-1"]).toEqual({ outstanding: 0, ageDays: null });
  });
});
