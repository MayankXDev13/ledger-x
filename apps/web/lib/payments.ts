import type { PaymentMethod } from "./api";

export const paymentMethodLabels: Record<PaymentMethod, string> = {
  cash: "Cash",
  upi: "UPI",
  other: "Other",
};

/** Human-readable label for a stored payment method, or null when unset. */
export function paymentMethodLabel(
  method?: PaymentMethod | null,
): string | null {
  return method ? paymentMethodLabels[method] : null;
}

/**
 * A debit entry with a payment method is a recorded payment against the
 * customer's balance, not an unrelated charge. It gets a distinct
 * presentation in history views.
 */
export function isPaymentEntry(transaction: {
  type: "credit" | "debit";
  paymentMethod?: PaymentMethod | null;
}): boolean {
  return transaction.type === "debit" && !!transaction.paymentMethod;
}
