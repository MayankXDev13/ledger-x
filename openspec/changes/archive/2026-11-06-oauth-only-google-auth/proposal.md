# Proposal

## Why

Password auth adds breach, reset, and hashing-maintenance burden for a single-owner ledger app. Moving to Google-only OAuth removes passwords entirely while keeping per-user data isolation.

## What Changes

- **BREAKING** Enable Google OAuth via Better Auth social sign-in; disable `emailAndPassword`.
- **BREAKING** Remove `POST /auth/signup`, `/auth/login`, `/auth/request-reset`, `/auth/reset-password`, `/auth/change-password` (respond `410` with JSON envelope or remove; decision locked in design).
- **BREAKING** Purge stored credential hashes (`account.password` for `providerId=credential`) and drop password validators/schemas.
- Link first Google sign-in with a matching email to the existing `user.id`, preserving customers/transactions (the one-user migration path); never create a duplicate user for a known email.
- Replace web login/signup/password pages and Expo auth screens with "Continue with Google" flows; keep session Bearer usage unchanged.
- Update audit events: stop `auth.password_reset*`/password-change entries, record OAuth login/logout.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `user-auth`: replace email/password signup/login/reset with Google-only OAuth, same-session Bearer contract, and same-id account linking for the existing password user.
- `audit-logging`: narrow "Auth events are audited" — OAuth signup/login/logout audited; password-reset request, password change, and password-based login-failure events no longer emitted.

## Impact

- Affected: `apps/api` (`better-auth.ts`, `routes/auth.ts`, `validators.ts`, `lib/auth.ts`, `db/schema.ts` account rows), `apps/web` login/signup/forgot/reset pages + API client, `apps/app` auth screens + `lib/auth-session.ts`, contract tests `auth.test.ts`/`auth-flows.test.ts`.
- Requires `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` (and Expo redirect config); no Google creds = no login.
- Existing password hashes destroyed; users who have not linked Google must sign in with the same email via Google to regain access.
