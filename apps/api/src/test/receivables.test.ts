import { describe, expect, it } from "bun:test";
import {
  agingBuckets,
  bucketAge,
  computeReceivables,
} from "../lib/receivables";

const DAY = 24 * 60 * 60 * 1000;
const now = new Date("2026-11-07T00:00:00.000Z");

function daysAgo(days: number): Date {
  return new Date(now.getTime() - days * DAY);
}

describe("computeReceivables", () => {
  it("computes a balance from credits minus debits", () => {
    const receivables = computeReceivables(
      [
        { customerId: "c1", amount: 1000, type: "credit", createdAt: daysAgo(10) },
        { customerId: "c1", amount: 400, type: "debit", createdAt: daysAgo(5) },
      ],
      now,
    );

    expect(receivables.get("c1")?.balance).toBe(600);
  });

  it("applies payments FIFO to find the oldest unpaid credit", () => {
    const receivables = computeReceivables(
      [
        { customerId: "c1", amount: 300, type: "credit", createdAt: daysAgo(90) },
        { customerId: "c1", amount: 300, type: "credit", createdAt: daysAgo(45) },
        { customerId: "c1", amount: 300, type: "debit", createdAt: daysAgo(10) },
      ],
      now,
    );

    const receivable = receivables.get("c1");
    // The first 300 credit is fully paid, so the 45-day-old credit ages.
    expect(receivable?.ageDays).toBe(45);
    expect(receivable?.balance).toBe(300);
  });

  it("reports no unpaid credit when fully paid", () => {
    const receivables = computeReceivables(
      [
        { customerId: "c1", amount: 300, type: "credit", createdAt: daysAgo(90) },
        { customerId: "c1", amount: 300, type: "debit", createdAt: daysAgo(10) },
      ],
      now,
    );

    expect(receivables.get("c1")?.balance).toBe(0);
    expect(receivables.get("c1")?.oldestUnpaidCreditAt).toBeNull();
    expect(receivables.get("c1")?.ageDays).toBeNull();
  });
});

describe("aging buckets", () => {
  it("maps ages to the documented buckets", () => {
    expect(bucketAge(0)).toBe("0-30");
    expect(bucketAge(30)).toBe("0-30");
    expect(bucketAge(31)).toBe("31-60");
    expect(bucketAge(60)).toBe("31-60");
    expect(bucketAge(61)).toBe("60+");
  });

  it("sums only positive balances into buckets", () => {
    const receivables = computeReceivables(
      [
        { customerId: "c1", amount: 1000, type: "credit", createdAt: daysAgo(45) },
        { customerId: "c2", amount: 500, type: "credit", createdAt: daysAgo(5) },
        { customerId: "c3", amount: 700, type: "credit", createdAt: daysAgo(100) },
        { customerId: "c3", amount: 700, type: "debit", createdAt: daysAgo(1) },
      ],
      now,
    );

    expect(agingBuckets(receivables.values())).toEqual({
      "0-30": 500,
      "31-60": 1000,
      "60+": 0,
    });
  });
});
