# Tasks

## 1. API Google OAuth + password disablement

- [x] 1.1 Replace the dead module-level Better Auth instance with a per-request `getAuth(env)` factory (Hyperdrive DB, `socialProviders.google`, `emailAndPassword.enabled: false`, `bearer()` plugin, `accountLinking` with `trustedProviders: ["google"]`, fail-fast on missing env), mount the handler at `/api/auth/*`, migrate Bearer verification to `auth.api.getSession`, and verify typecheck plus a Google sign-in issues a session token accepted by `GET /auth/me` as Bearer in staging.
- [x] 1.2 Disable `POST /auth/signup`, `/auth/login`, `/auth/request-reset`, `/auth/reset-password`, `/auth/change-password` to return `410` JSON envelope, remove password validators/schemas and hash helpers from request paths, and verify removed endpoints return `410` while `/auth/me` + `/auth/logout` still work in contract tests.
- [x] 1.3 Implement same-email account linking (Google verified email → existing `user.id`, no duplicate user; migration sets `email_verified = true` for the existing row) with OAuth audit events (`auth.login`/`auth.logout`/first-link, no password entries), and verify tests cover link-keeps-data plus different-email-does-not-touch-existing-user in staging.

## 2. Credential purge migration

- [x] 2.1 Back up `account` credential rows, purge `providerId='credential'` hashes and set `email_verified = true` for the existing user via migration, and verify no `account.password` credential rows remain and existing sessions/data are intact on a scratch database.
- [x] 2.2 Update `docs/auth-migration.md` (or equivalent) for Google-only flow and verify documented env vars and linking steps match implementation.

## 3. Web client

- [x] 3.1 Replace web login/signup/password pages with "Continue with Google" flow via the Better Auth client, persisting the Bearer token from the `set-auth-token` header, and verify manual sign-in reaches the dashboard with `NEXT_PUBLIC_API_URL` set and no password form remains.
- [x] 3.2 Remove web password API helpers and forgot/reset routes, and verify `grep -ri "auth/signup\|auth/login\|request-reset\|reset-password\|change-password" apps/web/app apps/web/lib` is clean and typecheck passes.

## 4. Mobile client

- [x] 4.1 Add Expo Google sign-in via `@better-auth/expo` (system browser + deep-link callback) storing the same session token, and verify sign-in, `getSessionUser`, and sign-out work against staging.
- [x] 4.2 Remove Expo password screens and `signUp/signIn/requestPasswordReset/resetPassword/changePassword` helpers, and verify no password UI or helper remains and the app builds.

## 5. Regression verification

- [x] 5.1 Rewrite `auth.test.ts`/`auth-flows.test.ts` for Google-only (linking, 410s, session revocation, audit) and verify `bun run test` passes from the repo root without external services.
