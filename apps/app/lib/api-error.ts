/**
 * The API answers a failed request with an envelope: `error` names the
 * failure and `details` names the fields that were rejected. The envelope
 * error is often just "Validation failed", so the field detail is what tells
 * the shopkeeper which field to fix.
 */

export type ApiErrorDetails = Record<string, string[] | undefined>;

/**
 * Appends the field details to the envelope error.
 *
 * A detail that already names its field is not prefixed twice, so the message
 * reads as "Validation failed · amount must be a whole number of rupees"
 * rather than repeating the field.
 */
export function formatApiErrorMessage(
  message: string,
  details?: ApiErrorDetails,
): string {
  if (!details) return message;

  const rendered: string[] = [];
  for (const [field, messages] of Object.entries(details)) {
    const detail = messages?.find((entry) => entry.trim().length > 0);
    if (!detail) continue;
    rendered.push(
      detail.toLowerCase().startsWith(field.toLowerCase())
        ? detail
        : `${field}: ${detail}`,
    );
  }

  return rendered.length > 0 ? `${message} · ${rendered.join("; ")}` : message;
}
