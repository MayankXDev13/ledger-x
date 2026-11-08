export type LedgerEntry = {
  customerId: string;
  amount: number;
  type: "credit" | "debit";
  createdAt: Date | string;
};

export type CustomerReceivable = {
  customerId: string;
  totalCredit: number;
  totalDebit: number;
  balance: number;
  oldestUnpaidCreditAt: Date | null;
  ageDays: number | null;
};

const DAY_MS = 24 * 60 * 60 * 1000;

function toDate(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value);
}

/**
 * Per-customer balance plus the age of the oldest unpaid credit under
 * first-in-first-out application of payments.
 *
 * FIFO means payments (debit entries) are applied to the oldest credits
 * first, so the "oldest unpaid credit" is the first credit whose cumulative
 * amount exceeds the total paid.
 */
export function computeReceivables(
  entries: LedgerEntry[],
  now: Date = new Date(),
): Map<string, CustomerReceivable> {
  type Acc = {
    totalCredit: number;
    totalDebit: number;
    credits: { amount: number; createdAt: Date }[];
  };

  const byCustomer = new Map<string, Acc>();

  for (const entry of entries) {
    const acc = byCustomer.get(entry.customerId) ?? {
      totalCredit: 0,
      totalDebit: 0,
      credits: [],
    };

    if (entry.type === "credit") {
      acc.totalCredit += entry.amount;
      acc.credits.push({ amount: entry.amount, createdAt: toDate(entry.createdAt) });
    } else {
      acc.totalDebit += entry.amount;
    }

    byCustomer.set(entry.customerId, acc);
  }

  const result = new Map<string, CustomerReceivable>();

  for (const [customerId, acc] of byCustomer) {
    const balance = acc.totalCredit - acc.totalDebit;
    let oldestUnpaidCreditAt: Date | null = null;

    if (acc.totalCredit > acc.totalDebit) {
      const credits = [...acc.credits].sort(
        (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
      );
      let cumulative = 0;

      for (const credit of credits) {
        cumulative += credit.amount;
        if (cumulative > acc.totalDebit) {
          oldestUnpaidCreditAt = credit.createdAt;
          break;
        }
      }
    }

    const ageDays = oldestUnpaidCreditAt
      ? Math.max(
          0,
          Math.floor(
            (now.getTime() - oldestUnpaidCreditAt.getTime()) / DAY_MS,
          ),
        )
      : null;

    result.set(customerId, {
      customerId,
      totalCredit: acc.totalCredit,
      totalDebit: acc.totalDebit,
      balance,
      oldestUnpaidCreditAt,
      ageDays,
    });
  }

  return result;
}

export type AgingBuckets = {
  "0-30": number;
  "31-60": number;
  "60+": number;
};

export function bucketAge(ageDays: number): keyof AgingBuckets {
  if (ageDays <= 30) return "0-30";
  if (ageDays <= 60) return "31-60";
  return "60+";
}

export function agingBuckets(
  receivables: Iterable<CustomerReceivable>,
): AgingBuckets {
  const buckets: AgingBuckets = { "0-30": 0, "31-60": 0, "60+": 0 };

  for (const receivable of receivables) {
    if (receivable.balance <= 0 || receivable.ageDays === null) continue;
    buckets[bucketAge(receivable.ageDays)] += receivable.balance;
  }

  return buckets;
}
