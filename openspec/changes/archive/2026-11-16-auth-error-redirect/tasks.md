# Tasks

## 1. API configuration and redirect handling

- [x] 1.1 Add a validated `WEB_APP_URL` Worker var (with an `http(s)` scheme check) and a helper that resolves the browser-safe login URL from it with a fallback to the first `http(s)` entry in `TRUSTED_ORIGINS`; verify by adding a unit test covering the configured value, the trusted-origin fallback, and rejection of non-`http(s)` origins.
- [x] 1.2 Set `onAPIError.errorURL` on the Better Auth instance in `apps/api/src/lib/better-auth.ts` to a login URL derived from 1.1; verify with a unit/integration test that a Better Auth callback error response redirects to the web `/login` URL and not to `${BETTER_AUTH_URL}/error`.
- [x] 1.3 Accept an `errorCallbackURL` query parameter on `GET /api/auth/redirect/google`, validate it as a trusted `http(s)` origin (falling back to the global login URL when untrusted or absent), and forward it in the internal `/api/auth/sign-in/social` body; verify with tests for the trusted case, the untrusted case, and the absent case, plus `bun run --cwd apps/api typecheck`.

## 2. Web sign-in and login error display

- [x] 2.1 Extend `signInWithGoogle()` in `apps/web/lib/auth.ts` to append an `errorCallbackURL` pointing at `window.location.origin + "/login"` to the redirect request, leaving `callbackURL` unchanged; verify with a unit test asserting the constructed URL and verifying the successful flow still redirects to `LANDING_ROUTE`.
- [x] 2.2 Add error-code-to-message mapping and render the authentication error on `apps/web/app/login/page.tsx` by reading `error`/`error_description` from the query string, showing readable generic text plus a retry action, and clearing the query after display via `router.replace("/login")`; verify with a component test that the message and retry button appear and the query is cleared, and that no raw provider error text is rendered.
- [x] 2.3 Confirm client-side sign-in failures (rejected promise / network error) keep the user on the login page with visible feedback; verify by simulating a rejected sign-in and asserting no navigation away from `/login` occurs, then run `bun run --cwd apps/web typecheck` and `bun run --cwd apps/web lint`.

## 3. Mobile sign-in feedback

- [x] 3.1 Ensure a failed social sign-in in `apps/app/app/auth/login.tsx` keeps the user on the mobile login screen with visible failure feedback and does not advance navigation; verify by simulating a rejected sign-in and asserting the login screen remains active with an error shown, then run the app's typecheck/lint script.

## 4. Configuration and integration verification

- [x] 4.1 Document `WEB_APP_URL` and the required `TRUSTED_ORIGINS` web origin in the API `.dev.vars.example` and deployment configuration, and verify the documented value matches the local dev web origin used in manual testing.
- [x] 4.2 Run the full verification suite (`bun run typecheck`, `bun run lint`, `bun run test`) and verify a forced failed OAuth callback lands on the web `/login?error=…` page with a readable message and working retry — never on the API `/error` page or a JSON 404 — while a successful sign-in still reaches the canonical landing route with a valid token.
