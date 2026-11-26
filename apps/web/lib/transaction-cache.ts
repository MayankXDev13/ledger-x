import type { InfiniteData } from "@tanstack/react-query";
import type { Analytics, PagedTransactions, Transaction } from "./api";

export type CustomerBalancesMap = Record<
  string,
  { outstanding: number; ageDays: number | null }
>;

export interface DashboardMetrics {
  totalBalance: number;
  totalCustomers: number;
  monthlyNet: number;
}

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

function isInCurrentMonth(iso?: string, now = new Date()): boolean {
  if (!iso) return true;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return true;
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth()
  );
}

function utcMonthKey(iso?: string, now = new Date()): string {
  const date = iso ? new Date(iso) : now;
  const valid = Number.isNaN(date.getTime()) ? now : date;
  return `${valid.getUTCFullYear()}-${String(valid.getUTCMonth() + 1).padStart(2, "0")}`;
}

/**
 * Patch cached `/dashboard/metrics` immediately when a transaction is created,
 * updated, or deleted so navigating from a customer page to the dashboard
 * never flashes stale totals while the background refetch runs.
 */
export function applyTransactionToDashboardMetrics(
  existing: DashboardMetrics | undefined,
  delta: number,
  createdAt?: string,
  now = new Date(),
): DashboardMetrics | undefined {
  if (!existing || delta === 0) return existing;

  return {
    ...existing,
    totalBalance: existing.totalBalance + delta,
    monthlyNet: isInCurrentMonth(createdAt, now)
      ? existing.monthlyNet + delta
      : existing.monthlyNet,
  };
}

/**
 * Patch cached `/dashboard/analytics` (monthly trend, top debtors, and total
 * receivables) immediately from a transaction delta before the server refetch
 * reconciles exact FIFO aging buckets.
 */
export function applyTransactionToDashboardAnalytics(
  existing: Analytics | undefined,
  params: {
    customerId: string;
    creditDelta: number;
    debitDelta: number;
    createdAt?: string;
    previousCustomerOutstanding?: number;
  },
  now = new Date(),
): Analytics | undefined {
  if (!existing) return existing;
  const { customerId, creditDelta, debitDelta, createdAt } = params;
  if (creditDelta === 0 && debitDelta === 0) return existing;

  const balanceDelta = creditDelta - debitDelta;
  const targetMonth = utcMonthKey(createdAt, now);

  const trend = existing.trend.map((point) =>
    point.month === targetMonth
      ? {
          ...point,
          credit: Math.max(0, point.credit + creditDelta),
          debit: Math.max(0, point.debit + debitDelta),
        }
      : point,
  );

  const existingDebtor = existing.topDebtors.find(
    (d) => d.customerId === customerId,
  );
  const prevOutstanding =
    params.previousCustomerOutstanding ?? existingDebtor?.outstanding ?? 0;
  const nextOutstanding = prevOutstanding + balanceDelta;
  const receivableDelta =
    Math.max(0, nextOutstanding) - Math.max(0, prevOutstanding);

  const topDebtors = existingDebtor
    ? existing.topDebtors
        .map((d) =>
          d.customerId === customerId
            ? {
                ...d,
                outstanding: nextOutstanding,
                ageDays:
                  nextOutstanding <= 0
                    ? null
                    : d.ageDays === null
                      ? 0
                      : d.ageDays,
              }
            : d,
        )
        .filter((d) => d.outstanding > 0)
        .sort((a, b) => b.outstanding - a.outstanding)
    : existing.topDebtors;

  return {
    ...existing,
    trend,
    topDebtors,
    totalReceivables: Math.max(0, existing.totalReceivables + receivableDelta),
  };
}

/**
 * Patch a non-infinite paged customer transaction query (`useCustomerTransactions`)
 * when a transaction is created.
 */
export function applyCreatedTransactionToPaged(
  existing: PagedTransactions | undefined,
  created: Transaction,
): PagedTransactions | undefined {
  if (!existing) return existing;
  if (existing.data.some((tx) => tx.id === created.id)) return existing;

  const prevBalance =
    Number(existing.totalCredit ?? 0) - Number(existing.totalDebit ?? 0);
  const delta = signedDelta(created.type, created.amount);
  const optimisticTx: Transaction = {
    ...created,
    runningBalance:
      created.runningBalance !== undefined
        ? created.runningBalance
        : prevBalance + delta,
  };

  return {
    ...existing,
    data:
      existing.page === 1
        ? [optimisticTx, ...existing.data].slice(0, existing.pageSize)
        : existing.data,
    total: (existing.total ?? 0) + 1,
    totalCredit:
      Number(existing.totalCredit ?? 0) +
      (created.type === "credit" ? created.amount : 0),
    totalDebit:
      Number(existing.totalDebit ?? 0) +
      (created.type === "debit" ? created.amount : 0),
    totalAmount: Number(existing.totalAmount ?? 0) + created.amount,
  };
}
