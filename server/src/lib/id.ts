/**
 * Generates a new random UUID v4.
 * Uses the Web Crypto API available in Cloudflare Workers.
 */
export function generateId(): string {
  return crypto.randomUUID();
}
