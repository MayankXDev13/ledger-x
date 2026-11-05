# Auth migration: Supabase Auth -> Better Auth

**BREAKING**: Supabase access tokens stop working at cutover. Password hashes
cannot be migrated, so every user sets a new password.

## How it works

1. `auth.users` rows are imported into Neon's `"user"` table with
   `email_verified = false` (see `apps/api/scripts/import-supabase-to-neon.ts`).
   IDs are preserved (UUID strings), so `user_id` ownership links survive.
2. The user requests a reset: `POST /auth/request-reset { email }`
   (always returns success to avoid email enumeration).
3. The reset email contains a link to
   `/reset-password?email=<email>&token=<token>`.
4. `POST /auth/reset-password { email, token, newPassword }` sets the password
   and revokes all existing sessions for that user.
5. Login with the new password: `POST /auth/login` returns a session token,
   sent as `Authorization: Bearer <token>`.

## Client changes

- Web: `apps/web/lib/auth.ts` (signup/login/logout/me/reset), token in
  `localStorage`, `useAuth` loads `/auth/me`. Password change:
  `POST /auth/change-password` (revokes other sessions).
- Mobile: `apps/app/lib/auth-session.ts` (same flows, AsyncStorage).
  Auth screens use it. The data screens still query Supabase directly and are
  tracked as follow-up work (see below).

## Follow-up (mobile data layer)

`apps/app` data screens (`customers/*`, `ledger/*`, `tags/*`) still read the
`contacts`/`ledger_entries` schema from Supabase. They must be rewritten
against the Workers API (`/customers`, `/transactions`, `/transaction-tags`,
`/dashboard`) using `getAuthHeaders()`. Until then, keep Supabase read-only
and do not ship mobile updates that write.

## Verification

- API: `bun test` covers signup/login/logout/reset, expired sessions, and
  legacy-token rejection (`apps/api/src/test/auth*.test.ts`).
- Manual: sign up, log in, `GET /auth/me` -> 200; legacy token -> 401;
  reset flow logs in and old sessions return 401.
