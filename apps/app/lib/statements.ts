// Statement rendering helpers: HTML template for expo-print and the shared
// file naming convention `<customer-slug>-statement-<start>_<end>.pdf`.
import type { Statement } from "./api";
import { paymentMethodLabel } from "./payments";

// HTML entity escapes built from char codes so this file never contains a
// literal entity that could be double-decoded by tooling.
const HTML_ESCAPES: Record<string, string> = {
  "&": String.fromCodePoint(38) + "amp;",
  "<": String.fromCodePoint(38) + "lt;",
  ">": String.fromCodePoint(38) + "gt;",
  '"': String.fromCodePoint(38) + "quot;",
  "'": String.fromCodePoint(38) + "#39;",
};

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => HTML_ESCAPES[char]);
}

export function formatStatementDate(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatMoney(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/** `ramesh-kumar-statement-2026-01-01_2026-01-31.pdf` */
export function statementFileName(
  customerName: string,
  start?: string | null,
  end?: string | null,
): string {
  const slug = customerName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "customer";
  const day = (value?: string | null) =>
    value ? value.slice(0, 10) : "all-time";
  return `${slug}-statement-${day(start)}_${day(end)}.pdf`;
}

/**
 * Shared HTML document rendered to PDF via expo-print. Mirrors the web
 * statement layout: period header, opening/closing balances, totals, and a
 * per-entry running balance table.
 */
export function renderStatementHtml(
  statement: Statement,
  opts: { businessName?: string } = {},
): string {
  const business = escapeHtml(opts.businessName?.trim() || "Ledger-X");
  const period =
    statement.start && statement.end
      ? `${formatStatementDate(statement.start)} – ${formatStatementDate(statement.end)}`
      : statement.start
        ? `From ${formatStatementDate(statement.start)}`
        : statement.end
          ? `Until ${formatStatementDate(statement.end)}`
          : "All transactions";

  const rows = statement.entries
    .map((entry) => {
      const method = paymentMethodLabel(entry.paymentMethod);
      return `
        <tr>
          <td>${formatStatementDate(entry.date)}</td>
          <td>${escapeHtml(entry.note || (entry.type === "credit" ? "Credit" : "Payment"))}${
            method ? ` <span class="method">${method}</span>` : ""
          }</td>
          <td class="num credit">${
            entry.type === "credit" ? formatMoney(entry.amount) : "—"
          }</td>
          <td class="num debit">${
            entry.type === "debit" ? formatMoney(entry.amount) : "—"
          }</td>
          <td class="num">${formatMoney(entry.runningBalance)}</td>
        </tr>`;
    })
    .join("");

  const body =
    statement.entries.length > 0
      ? rows
      : `<tr><td colspan="5" class="empty">No transactions in this period.</td></tr>`;

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<title>${escapeHtml(statement.customer.name)} statement</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: -apple-system, Roboto, 'Segoe UI', sans-serif; color: #111; margin: 24px; }
  h1 { font-size: 18px; margin: 0; }
  .muted { color: #666; font-size: 11px; }
  .header { display: flex; justify-content: space-between; border-bottom: 1px solid #ddd; padding-bottom: 12px; }
  .customer { margin: 16px 0; }
  .totals { display: flex; gap: 24px; margin-top: 8px; font-size: 12px; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 16px; }
  th { text-align: left; border-bottom: 1px solid #ddd; padding: 6px 8px; font-size: 10px; text-transform: uppercase; color: #666; }
  td { padding: 8px; border-bottom: 1px solid #eee; }
  .num { text-align: right; white-space: nowrap; }
  .credit { color: #171717; }
  .debit { color: #047857; }
  .method { background: #d1fae5; color: #065f46; font-size: 11px; padding: 1px 5px; border-radius: 4px; }
  .empty { text-align: center; color: #888; padding: 32px 0; }
  .footnote { margin-top: 16px; font-size: 10px; color: #888; }
</style>
</head>
<body>
  <div class="header">
    <div>
      <h1>${business}</h1>
      <p class="muted">Customer account statement</p>
    </div>
    <div style="text-align:right">
      <p class="muted">Statement period</p>
      <p style="font-size:12px;font-weight:600;margin:2px 0">${period}</p>
      <p class="muted">Generated ${formatStatementDate(new Date().toISOString())}</p>
    </div>
  </div>

  <div class="customer">
    <p class="muted">Customer</p>
    <p style="font-weight:700;margin:2px 0">${escapeHtml(statement.customer.name)}</p>
    <p class="muted">${escapeHtml(statement.customer.phone)}</p>
    <div class="totals">
      <span>Opening: <strong>${formatMoney(statement.openingBalance)}</strong></span>
      <span class="credit">Credit: <strong>${formatMoney(statement.totalCredit)}</strong></span>
      <span class="debit">Paid: <strong>${formatMoney(statement.totalDebit)}</strong></span>
      <span>Closing: <strong>${formatMoney(statement.closingBalance)}</strong></span>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Date</th><th>Description</th>
        <th class="num">Credit</th><th class="num">Paid</th><th class="num">Balance</th>
      </tr>
    </thead>
    <tbody>${body}</tbody>
  </table>

  <p class="footnote">
    Balances are computed over the customer's full history. Soft-deleted entries
    are excluded. Generated by Ledger-X; not a tax invoice.
  </p>
</body>
</html>`;
}
