import { describe, expect, test } from "bun:test";
import { moneyPresentation, moneyTextClass, OVERDUE_AFTER_DAYS } from "./money";
import { formatCurrency, formatCompactCurrency, formatMonthLabel } from "./format";

describe("moneyPresentation", () => {
  test("credit given is neutral with a plus sign", () => {
    const result = moneyPresentation({ type: "credit" });
    expect(result.tone).toBe("credit");
    expect(result.sign).toBe("+");
    expect(result.label).toBe("Credit given");
    expect(moneyTextClass(result.tone)).toBe("text-foreground");
  });

  test("a payment received uses the positive tone with a minus sign", () => {
    const result = moneyPresentation({ type: "debit", paymentMethod: "cash" });
    expect(result.tone).toBe("paid");
    expect(result.sign).toBe("−");
    expect(result.label).toBe("Payment received");
    expect(moneyTextClass(result.tone)).toBe("text-positive");
  });

  test("a debit without a payment method is a plain debit", () => {
    const result = moneyPresentation({ type: "debit" });
    expect(result.tone).toBe("debit");
    expect(result.sign).toBe("−");
  });

  test("an unpaid balance of 60 days or more is overdue", () => {
    expect(moneyPresentation({ type: "debit", ageDays: OVERDUE_AFTER_DAYS }).tone).toBe("overdue");
    expect(moneyPresentation({ type: "debit", ageDays: OVERDUE_AFTER_DAYS - 1 }).tone).toBe("debit");
  });

  test("a payment stays a payment even when it is old", () => {
    expect(moneyPresentation({ type: "debit", paymentMethod: "upi", ageDays: 200 }).tone).toBe("paid");
  });
});

describe("formatCurrency", () => {
  test("uses Indian digit grouping", () => {
    expect(formatCurrency(1234567)).toContain("12,34,567");
  });

  test("drops the sign so the caller controls direction", () => {
    expect(formatCurrency(-500)).toBe(formatCurrency(500));
  });
});

describe("formatCompactCurrency", () => {
  test("abbreviates thousands and keeps rupees below a thousand", () => {
    expect(formatCompactCurrency(1500)).toBe("₹2k");
    expect(formatCompactCurrency(500)).toBe("₹500");
  });
});

describe("formatMonthLabel", () => {
  test("renders a short month label", () => {
    expect(formatMonthLabel("2026-01")).toBe("Jan 26");
  });
});
