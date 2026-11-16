/**
 * Shared money and aging labels.
 *
 * The same figure and the same age used to be named differently on the
 * dashboard, collection and customer cards. Import these so a shopkeeper sees
 * one language across the app.
 */

/** The one label for the ledger total, wherever it is shown. */
export const TOTAL_OUTSTANDING_LABEL = "Total outstanding";

/** Full, unabbreviated aging phrase used on cards and collection rows. */
export function oldestUnpaidLabel(days: number): string {
  return `Oldest unpaid ${days} ${days === 1 ? "day" : "days"}`;
}
