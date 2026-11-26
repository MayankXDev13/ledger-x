import { format } from "date-fns";
import type { Customer, Transaction } from "./api";
import { moneyPresentation, type MoneyTone } from "./money";

export interface RecentChartDatum {
  id: string;
  /** Disambiguated X-axis tick label (unique even when multiple entries share a day). */
  name: string;
  /** Descriptive tooltip header (customer name + date/time). */
  tooltipLabel: string;
  /** Signed amount: positive for credit given, negative for payment/debit received. */
  amount: number;
  type: "credit" | "debit";
  tone: MoneyTone;
  sign: "+" | "−" | "";
  /** Human-readable direction label for flow and by-type charts. */
  typeLabel: string;
}

/**
 * Build chronological chart points for the Dashboard's Transaction Flow and
 * By Type charts.
 *
 * - Disambiguates X-axis labels when multiple entries fall on the same day so
 *   Recharts never collapses or repeats identical date ticks.
 * - Classifies every debit as "Payment received" regardless of whether an
 *   optional payment method was chosen, so debits without a payment method are
 *   never mislabeled or miscolored as Credit.
 */
export function buildRecentChartData(
  recentTxns: Transaction[] | undefined,
  customers?: Customer[],
): RecentChartDatum[] {
  if (!recentTxns?.length) return [];

  const chronological = [...recentTxns].reverse();
  const customerNames = new Map(
    (customers ?? []).map((customer) => [customer.id, customer.name]),
  );

  const dayCounts = new Map<string, number>();
  for (const tx of chronological) {
    const day = format(new Date(tx.createdAt), "MMM d");
    dayCounts.set(day, (dayCounts.get(day) ?? 0) + 1);
  }

  const usedLabels = new Map<string, number>();

  return chronological.map((tx) => {
    const created = new Date(tx.createdAt);
    const day = format(created, "MMM d");
    const hasSameDaySiblings = (dayCounts.get(day) ?? 0) > 1;
    const baseAxisLabel = hasSameDaySiblings
      ? format(created, "MMM d, h:mm a")
      : day;

    const seenCount = (usedLabels.get(baseAxisLabel) ?? 0) + 1;
    usedLabels.set(baseAxisLabel, seenCount);
    const axisLabel =
      seenCount > 1 ? `${baseAxisLabel} (#${seenCount})` : baseAxisLabel;

    const customerName = customerNames.get(tx.customerId);
    const dateWithTime = format(created, "MMM d, h:mm a");
    const tooltipLabel = customerName
      ? `${customerName} · ${dateWithTime}`
      : dateWithTime;

    const money = moneyPresentation(tx);
    const isCredit = tx.type === "credit";

    return {
      id: tx.id,
      name: axisLabel,
      tooltipLabel,
      amount: isCredit ? tx.amount : -tx.amount,
      type: tx.type,
      tone: money.tone,
      sign: isCredit ? "+" : "−",
      typeLabel: isCredit ? "Credit given" : "Payment received",
    };
  });
}
