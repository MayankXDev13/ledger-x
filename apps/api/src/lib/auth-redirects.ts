import type { Bindings } from "../types/hono";

export const DEFAULT_TRUSTED_ORIGIN = "http://localhost:3000";

const LOGIN_PATH = "/login";

/** All configured trusted origins, including non-browser schemes (e.g. ledgerx://). */
export function trustedOrigins(env: Bindings): string[] {
  return (env.TRUSTED_ORIGINS ?? DEFAULT_TRUSTED_ORIGIN)
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

/**
 * Normalize a value to an absolute http(s) origin. Returns null for relative
 * values, mobile deep-link schemes, and malformed URLs so they are never used
 * as browser redirect targets.
 */
function httpOrigin(value: string | undefined | null): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.origin;
  } catch {
    return null;
  }
}

/**
 * The canonical browser login URL. Prefers the explicit WEB_APP_URL var and
 * falls back to the first http(s) trusted origin, then the local dev default.
 */
export function browserLoginURL(env: Bindings): string {
  const base =
    httpOrigin(env.WEB_APP_URL) ??
    trustedOrigins(env)
      .map((origin) => httpOrigin(origin))
      .find((origin): origin is string => origin !== null) ??
    DEFAULT_TRUSTED_ORIGIN;
  return `${base}${LOGIN_PATH}`;
}

/**
 * Resolve a caller-supplied error redirect target. Only absolute http(s) URLs
 * whose origin is trusted are honoured; anything else falls back to the login
 * page. This prevents open redirects through the OAuth error flow.
 */
export function resolveErrorCallbackURL(
  raw: string | undefined | null,
  env: Bindings,
): string {
  const fallback = browserLoginURL(env);
  if (!raw) return fallback;

  const origin = httpOrigin(raw);
  if (!origin) return fallback;

  const trusted = trustedOrigins(env).some(
    (candidate) => httpOrigin(candidate) === origin,
  );
  return trusted ? raw : fallback;
}
