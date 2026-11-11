/**
 * The ledger stores whole rupees, so every entry point parses what the user
 * typed into a whole number of rupees or refuses it before anything is sent.
 */

export const WHOLE_RUPE_ERROR = "Amount must be a whole number of rupees";

export type AmountParse =
  | { ok: true; amount: number }
  | { ok: false; error: string };

/**
 * Parses a typed amount into whole rupees.
 *
 * A fractional amount is refused rather than rounded: the ledger has no place
 * to store paise, so rounding would silently change what the shopkeeper
 * recorded.
 */
export function parseWholeRupeAmount(input: string): AmountParse {
  const trimmed = input.trim();
  if (!trimmed) {
    return { ok: false, error: "Amount is required" };
  }

  const value = Number(trimmed);
  if (!Number.isFinite(value)) {
    return { ok: false, error: "Please enter a valid amount" };
  }
  if (value <= 0) {
    return { ok: false, error: "Please enter a valid amount" };
  }
  if (!Number.isInteger(value)) {
    return { ok: false, error: WHOLE_RUPE_ERROR };
  }

  return { ok: true, amount: value };
}
