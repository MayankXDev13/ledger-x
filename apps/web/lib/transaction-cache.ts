import type { InfiniteData } from "@tanstack/react-query";
import type { PagedTransactions, Transaction } from "./api";

export type CustomerBalancesMap = Record<
  string,
  { outstanding: number; ageDays: number | null }
>;

function signedDelta(type: "credit" | "debit", amount: number): number {
  return type === "credit" ? amount : -amount;
}

/**
 * Prepend a newly created transaction into a customer's infinite-query cache
 * so the list, totals, and hero balance update immediately while the
 * authoritative server refetch runs in the background.
 */
export function applyCreatedTransactionToInfinite(
  existing: InfiniteData<PagedTransactions> | undefined,
  created: Transaction,
): InfiniteData<PagedTransactions> | undefined {
  if (!existing || existing.pages.length === 0) return existing;

  const first = existing.pages[0];
  if (first.data.some((tx) => tx.id === created.id)) {
    return existing;
  }

  const prevBalance = Number(first.totalCredit ?? 0) - Number(first.totalDebit ?? 0);
  const delta = signedDelta(created.type, created.amount);
  const optimisticTx: Transaction = {
    ...created,
    runningBalance:
      created.runningBalance !== undefined
        ? created.runningBalance
        : prevBalance + delta,
  };

  const nextFirst: PagedTransactions = {
    ...first,
    data: [optimisticTx, ...first.data],
    total: (first.total ?? 0) + 1,
    totalCredit:
      Number(first.totalCredit ?? 0) +
      (created.type === "credit" ? created.amount : 0),
    totalDebit:
      Number(first.totalDebit ?? 0) +
      (created.type === "debit" ? created.amount : 0),
    totalAmount: Number(first.totalAmount ?? 0) + created.amount,
  };

  return {
    ...existing,
    pages: [nextFirst, ...existing.pages.slice(1)],
  };
}

/**
 * Patch an edited transaction in place inside a customer's infinite-query cache
 * and adjust page-0 aggregates by the credit/debit delta.
 */
export function applyUpdatedTransactionToInfinite(
  existing: InfiniteData<PagedTransactions> | undefined,
  updated: Transaction,
): {
  next: InfiniteData<PagedTransactions> | undefined;
  balanceDelta: number;
} {
  if (!existing || existing.pages.length === 0) {
    return { next: existing, balanceDelta: 0 };
  }

  let previous: Transaction | undefined;
  for (const page of existing.pages) {
    const match = page.data.find((tx) => tx.id === updated.id);
    if (match) {
      previous = match;
      break;
    }
  }

  if (!previous) {
    return { next: existing, balanceDelta: 0 };
  }

  const creditDelta =
    (updated.type === "credit" ? updated.amount : 0) -
    (previous.type === "credit" ? previous.amount : 0);
  const debitDelta =
    (updated.type === "debit" ? updated.amount : 0) -
    (previous.type === "debit" ? previous.amount : 0);
  const amountDelta = updated.amount - previous.amount;
  const balanceDelta =
    signedDelta(updated.type, updated.amount) -
    signedDelta(previous.type, previous.amount);

  const pages = existing.pages.map((page, index) => {
    const patchedData = page.data.map((tx) =>
      tx.id === updated.id
        ? {
            ...tx,
            ...updated,
            runningBalance:
              updated.runningBalance ??
              (tx.runningBalance !== undefined
                ? tx.runningBalance + balanceDelta
                : undefined),
          }
        : tx,
    );

    if (index === 0) {
      return {
        ...page,
        data: patchedData,
        totalCredit: Number(page.totalCredit ?? 0) + creditDelta,
        totalDebit: Number(page.totalDebit ?? 0) + debitDelta,
        totalAmount: Number(page.totalAmount ?? 0) + amountDelta,
      };
    }

    return {
      ...page,
      data: patchedData,
    };
  });

  return {
    next: { ...existing, pages },
    balanceDelta,
  };
}

/**
 * Remove a deleted transaction from a customer's infinite-query cache and
 * adjust page-0 totals immediately.
 */
export function applyDeletedTransactionToInfinite(
  existing: InfiniteData<PagedTransactions> | undefined,
  deletedId: string,
): {
  next: InfiniteData<PagedTransactions> | undefined;
  removed?: Transaction;
} {
  if (!existing || existing.pages.length === 0) {
    return { next: existing };
  }

  let removed: Transaction | undefined;
  for (const page of existing.pages) {
    const match = page.data.find((tx) => tx.id === deletedId);
    if (match) {
      removed = match;
      break;
    }
  }

  if (!removed) {
    return { next: existing };
  }

  const pages = existing.pages.map((page, index) => {
    const filteredData = page.data.filter((tx) => tx.id !== deletedId);
    if (index === 0) {
      return {
        ...page,
        data: filteredData,
        total: Math.max(0, (page.total ?? 0) - 1),
        totalCredit: Math.max(
          0,
          Number(page.totalCredit ?? 0) -
            (removed.type === "credit" ? removed.amount : 0),
        ),
        totalDebit: Math.max(
          0,
          Number(page.totalDebit ?? 0) -
            (removed.type === "debit" ? removed.amount : 0),
        ),
        totalAmount: Math.max(0, Number(page.totalAmount ?? 0) - removed.amount),
      };
    }
    return {
      ...page,
      data: filteredData,
    };
  });

  return {
    next: { ...existing, pages },
    removed,
  };
}

/**
 * Adjust a customer's entry in the `/customers/balances` cache by a signed
 * balance delta (+credit, -debit) so the Customers list reflects changes
 * immediately without waiting for the background refetch.
 */
export function applyBalanceDelta(
  existing: CustomerBalancesMap | undefined,
  customerId: string,
  delta: number,
): CustomerBalancesMap | undefined {
  if (!existing || delta === 0) return existing;

  const current = existing[customerId] ?? { outstanding: 0, ageDays: null };
  const nextOutstanding = current.outstanding + delta;
  const nextAgeDays =
    nextOutstanding <= 0 ? null : current.ageDays === null ? 0 : current.ageDays;

  return {
    ...existing,
    [customerId]: {
      outstanding: nextOutstanding,
      ageDays: nextAgeDays,
    },
  };
}
