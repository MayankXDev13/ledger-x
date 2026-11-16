# Design

## Context

See `proposal.md` for motivation. The relevant current state:

- Better Auth 1.7.17 runs in a Hono Worker behind a per-request `getAuth(env)` factory in `apps/api/src/lib/better-auth.ts`. The web client signs in by navigating the browser to `GET /api/auth/redirect/google?callbackURL=…` (`apps/web/lib/auth.ts`), which builds an internal `/api/auth/sign-in/social` request and forwards the OAuth state cookie (`apps/api/src/app.ts`). Successful callbacks are intercepted by `app.all("/api/auth/*")` to append a `#token=` fragment for the web app.
- Better Auth computes a failed-callback redirect as `options.onAPIError?.errorURL || ${baseURL}/error`, storing a flow-scoped `errorURL` from the sign-in request when present. This project configures neither `onAPIError.errorURL` nor `errorCallbackURL`, so failures navigate to the bare API origin `/error` — a standalone HTML page the app does not control, and in this Hono app a path that actually falls through to a JSON 404.
- `TRUSTED_ORIGINS` for the API may include non-browser schemes (e.g. `ledgerx://` for Expo), so it cannot be used verbatim as a browser redirect target.
- Better Auth already restricts callback URLs to configured trusted origins, which gives a validation point for caller-provided redirect targets.

## Goals / Non-Goals

**Goals:**

- Guarantee that every authentication failure ends on a page the product owns — the web login page by default, or a caller-provided trusted page.
- Make the failure understandable and recoverable on that page (message + retry) without exposing raw provider internals.
- Preserve the existing successful sign-in flow, token handoff, session validation, and canonical landing route unchanged.

**Non-Goals:**

- Adding or re-enabling password sign-in (Google remains the sole provider).
- Redesigning the login page visual system.
- Changing session storage, expiry, or audit logging.
- Centralizing all application error boundaries — this change covers authentication errors only.

## Decisions

1. **Set a global `onAPIError.errorURL` on the Better Auth instance, not a custom `/error` route.** The configuration lives in `getAuth()` and points to the web origin's `/login` route. It is built from a dedicated `WEB_APP_URL` Worker var with a fallback to the first `http(s)` entry in `TRUSTED_ORIGINS`. This fixes every callback failure, including ones the web flow never initiates. Alternative: add an API `/error` route that renders/redirects to the login page — rejected because it keeps the browser on the API origin for at least one hop and duplicates a page Better Auth already owns.

2. **Pass a flow-scoped `errorCallbackURL` from the web client.** `signInWithGoogle()` adds `errorCallbackURL=${window.location.origin}/login` to the `/api/auth/redirect/google` query, and that route forwards it into the internal `/api/auth/sign-in/social` body alongside `callbackURL`. The global `errorURL` remains the fallback. Alternative: rely only on the global setting — rejected because a per-flow value lets the caller choose a different recovery page (the "provided page" case) without a redeploy.

3. **Validate caller-provided error targets.** Only absolute `http(s)` URLs whose origin is in `TRUSTED_ORIGINS` are accepted; anything else falls back to the global login URL. Better Auth's origin check is the enforcement point, with a defensive check in the Hono route. Mobile deep-link schemes (`ledgerx://`) are filtered out of browser redirect candidates. Alternative: accept any URL — rejected as an open-redirect risk.

4. **Render errors on the existing login page via query parameters.** Better Auth appends `?error=<code>` (and optionally `error_description`) to the error URL. The login page reads them with `useSearchParams`, maps known codes to friendly, generic text, shows the message with a retry action, then clears the query via `router.replace("/login")` so it is not repeated on reload. Alternative: a cookie/flash-message store — rejected as unnecessary state for a single redirect.

5. **Keep client-side and mobile failures on their login screens.** Web sign-in already catches rejections into a toast; make that the explicit behavior and avoid any navigation to an error page. On mobile, the social sign-in call's failure path stays on `auth/login` with an alert/inline message rather than advancing navigation.

## Risks / Trade-offs

- [New `WEB_APP_URL` var is unset or wrong in an environment] → Fall back to the first `http(s)` trusted origin; document the var in `.dev.vars.example` and deployment configuration. A misconfigured value would send users to a wrong origin, so validate its scheme at startup.
- [Raw provider `error_description` may contain unwanted detail or sensitive values] → Map known error codes to generic copy; do not render the raw description to users.
- [Cyclic redirect if an authenticated user lands on `/login?error=…`] → The error banner is rendered on the public login page (outside the protected `(app)` group), the query is cleared after display, and `AuthGuard` only redirects anonymous users.
- [Error redirect dropped because the target origin is not trusted] → Ensure the deployed web origin is listed in `TRUSTED_ORIGINS`; untrusted inputs silently fall back to the global login URL rather than failing open.
- [Mobile scheme treated as a browser redirect target] → Filter redirect candidates to `http(s)` only.

## Migration Plan

1. Add `WEB_APP_URL` (web app origin, e.g. `http://localhost:3000` in dev) to API Worker vars/secrets and `.dev.vars.example`; ensure the same origin is present in `TRUSTED_ORIGINS`.
2. Deploy the API change (global `errorURL` + `errorCallbackURL` forwarding + validation), which is backward compatible with the current web client.
3. Deploy the web change (`errorCallbackURL` + login-page error display) and the mobile feedback change.
4. Verify by forcing a failed OAuth callback: the browser must land on `/login?error=…` with a readable message and a working retry, never on the API `/error` page or a JSON 404.
5. Rollback: remove the new configuration/UI handling; behavior returns to the previous default error page (known defect), with no data migration required.

## Open Questions

None.
