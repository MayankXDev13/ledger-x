# Proposal

## Why

When a Google OAuth callback fails (state mismatch, user denial, expired state, provider outage), Better Auth redirects the browser to its own standalone error page at `${BETTER_AUTH_URL}/error?error=…`. Because no error URL is configured, users are taken out of the web app onto a default, unbranded page — and in this deployment the path does not even match the `/api/auth/*` handler, so it falls through to a JSON 404 instead. The same class of failure leaves the login screen with no explanation or retry path. Users should always be returned to a page they can act on (the login page, or a caller-provided page) with a clear error, never a default error page.

## What Changes

- Configure Better Auth's `onAPIError.errorURL` so authentication errors redirect to the web login route instead of Better Auth's default `/error` page.
- Pass an explicit `errorCallbackURL` through the Google sign-in redirect flow so each flow controls where failures land, with a safe fallback to the login page.
- Constrain error redirect targets to trusted origins to prevent open-redirect abuse.
- Update the web login page to read `error` / `error_description` from the query string and show a friendly, actionable message with a retry path, then clear the parameter.
- Keep unrecoverable client-side sign-in failures (network errors, rejected promises) on the login screen with visible feedback rather than navigating away.
- Ensure the mobile sign-in screen likewise surfaces a failed sign-in on the login screen instead of stranding the user.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `user-auth`: Add requirements for authentication failure handling — failures redirect back to the login page (or a caller-provided, trusted page) instead of the default error page, and the destination presents a clear, recoverable error message.

## Impact

- **API (Hono / Cloudflare Workers)**: `apps/api/src/lib/better-auth.ts` (`onAPIError.errorURL`), `apps/api/src/app.ts` (`errorCallbackURL` in the internal social sign-in request), and auth-related env/origin configuration (`BETTER_AUTH_URL`, `TRUSTED_ORIGINS`, or a new web-base URL var).
- **Web (Next.js)**: `apps/web/lib/auth.ts` (add `errorCallbackURL` to the redirect request), `apps/web/app/login/page.tsx` (render and clear query-string errors), and possibly `apps/web/components/AuthGuard.tsx` to avoid redirect loops.
- **Mobile (Expo)**: `apps/app/app/auth/login.tsx` (surface sign-in failures on the login screen).
- **Behavior**: Browser URL after a failed sign-in changes from an API-origin `/error` page to the web `/login` route with an error query parameter. No change to successful sign-in, token handoff, session validation, or the canonical landing route.
- **Dependencies**: None new; uses existing Better Auth options and existing client code.
