import { isPaymentEntry } from "./payments";
import type { PaymentMethod } from "./api";

/**
 * How a money movement is presented.
 *
 * - `credit` — credit given: money the shopkeeper lent. Neutral, never green.
 * - `paid`   — a payment received. Emerald, and only emerald.
 * - `debit`  — a debit that is not a recorded payment (an unrelated charge).
 * - `overdue`— money owed for longer than the overdue threshold.
 */
export type MoneyTone = "credit" | "paid" | "debit" | "overdue";

export interface MoneyPresentation {
  /** Semantic tone used to pick the colour token. */
  tone: MoneyTone;
  /** Sign shown next to the amount: `+` for credit given, `−` for money in. */
  sign: "+" | "−" | "";
  /** Text label that carries the meaning without relying on colour. */
  label: string;
}

/** Days after which an unpaid credit is treated as overdue. */
export const OVERDUE_AFTER_DAYS = 60;

interface MoneyInput {
  type: "credit" | "debit";
  paymentMethod?: PaymentMethod | null;
  /** Age of the oldest unpaid credit, in days. */
  ageDays?: number;
}

/**
 * Single source of truth for how money reads on screen.
 *
 * Every consumer — transaction rows, statements, collection rows, dashboard
 * tiles and charts — asks this function instead of branching on `type`, so the
 * meaning of "money arrived" cannot drift between screens.
 */
export function moneyPresentation(entry: MoneyInput): MoneyPresentation {
  if (entry.type === "credit") {
    return { tone: "credit", sign: "+", label: "Credit given" };
  }
  if (isPaymentEntry({ type: entry.type, paymentMethod: entry.paymentMethod })) {
    return { tone: "paid", sign: "−", label: "Payment received" };
  }
  if (entry.ageDays !== undefined && entry.ageDays >= OVERDUE_AFTER_DAYS) {
    return { tone: "overdue", sign: "−", label: "Overdue" };
  }
  return { tone: "debit", sign: "−", label: "Debit" };
}

/** Tailwind text classes for each tone. Emerald is reserved for `paid`. */
export function moneyTextClass(tone: MoneyTone): string {
  switch (tone) {
    case "paid":
      return "text-positive";
    case "overdue":
      return "text-destructive";
    case "credit":
      return "text-foreground";
    default:
      return "text-foreground";
  }
}

/** Tailwind surface/tint classes for each tone. */
export function moneySurfaceClass(tone: MoneyTone): string {
  switch (tone) {
    case "paid":
      return "bg-positive/10 text-positive border-positive/25";
    case "overdue":
      return "bg-destructive/10 text-destructive border-destructive/25";
    default:
      return "bg-muted text-foreground border-border";
  }
}

/** Chart colour token for a tone. */
export function moneyChartColor(tone: MoneyTone): string {
  switch (tone) {
    case "paid":
      return "var(--chart-1)";
    case "overdue":
      return "var(--chart-3)";
    case "credit":
      return "var(--chart-2)";
    default:
      return "var(--chart-2)";
  }
}
