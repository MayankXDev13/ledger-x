/**
 * CSV serialization helpers shared by the export endpoints.
 * Amounts are stored as whole currency units (rupees) and exported with two
 * decimal places, matching the rest of the app's display behavior.
 */

export function formatAmount(amount: number): string {
  return amount.toFixed(2);
}

export function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return "";

  const text = value instanceof Date ? value.toISOString() : String(value);

  if (/[",\r\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }

  return text;
}

export function toCsv(headers: string[], rows: unknown[][]): string {
  const lines = [
    headers.map(csvEscape).join(","),
    ...rows.map((row) => row.map(csvEscape).join(",")),
  ];
  return `${lines.join("\r\n")}\r\n`;
}

export function csvResponse(filename: string, body: string): Response {
  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

/**
 * In-memory guard applied before any row is serialized into an export.
 * The SQL queries already exclude sample rows; this keeps the guarantee
 * testable and protects the archive path if its query changes.
 */
export function isExportable(
  row: { deletedAt?: Date | string | null; isSample?: boolean | null },
  opts: { includeDeleted?: boolean } = {},
): boolean {
  if (row.isSample) return false;
  if (!opts.includeDeleted && row.deletedAt) return false;
  return true;
}
