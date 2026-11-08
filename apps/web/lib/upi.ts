export type UpiConfig = {
  upiId: string;
  payeeName: string;
};

export type UpiRequest = UpiConfig & {
  /** Amount in whole currency units (rupees), matching ledger entries. */
  amount: number;
  note?: string;
};

/**
 * Builds a standard UPI intent URI. The amount is always two decimals in
 * rupees. The app never initiates or confirms the payment; the customer's
 * UPI app does that and the user records the payment manually.
 */
export function buildUpiUri({ upiId, payeeName, amount, note }: UpiRequest): string {
  const value = amount.toFixed(2);
  const parts = [
    `pa=${encodeURIComponent(upiId)}`,
    `pn=${encodeURIComponent(payeeName)}`,
    `am=${value}`,
    "cu=INR",
  ];

  if (note) parts.push(`tn=${encodeURIComponent(note)}`);

  return `upi://pay?${parts.join("&")}`;
}

/** The QR payload is the intent URI; scanning it opens the same request. */
export function buildUpiQrPayload(request: UpiRequest): string {
  return buildUpiUri(request);
}

export function isValidUpiId(value: string): boolean {
  return /^[a-zA-Z0-9._-]{2,256}@[a-zA-Z]{2,64}$/.test(value);
}
