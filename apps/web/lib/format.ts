/**
 * One currency formatter for the whole web client.
 *
 * `en-IN` grouping renders lakh and crore the way a shopkeeper reads them
 * (₹12,34,567). Fraction digits are dropped: the ledger stores whole rupees.
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Math.abs(value));
}

/** Formats a value with an explicit sign, e.g. `+₹500` or `−₹500`. */
export function formatSignedCurrency(value: number, sign: "+" | "−" | ""): string {
  return `${sign}${formatCurrency(value)}`;
}

/** Compact axis/summary form, e.g. `₹12k`. */
export function formatCompactCurrency(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1000) return `₹${(abs / 1000).toFixed(0)}k`;
  return `₹${abs}`;
}

/** Month label used by the dashboard trend axis, e.g. `Jan 25`. */
export function formatMonthLabel(value: string): string {
  const [year, month] = value.split("-");
  if (!year || !month) return value;
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, 1));
  return date.toLocaleDateString("en-IN", { month: "short", year: "2-digit", timeZone: "UTC" });
}
