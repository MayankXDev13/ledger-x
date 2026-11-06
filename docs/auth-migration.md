# Auth migration: passwords -> Google-only OAuth (Better Auth)

**BREAKING**: password endpoints return `410 Gone`. Google is the sole
sign-in method. Stored credential hashes are purged and cannot be restored
except from the pre-cutover backup.

## How it works

1. The API mounts the Better Auth handler at `/api/auth/*` (per-request
   instance: Hyperdrive DB + Worker secrets, see `getAuth` in
   `apps/api/src/lib/better-auth.ts`).
2. Web and Expo start a Google sign-in (`signIn.social({ provider: "google" })`).
3. On first sign-in, Better Auth implicitly links the verified Google email
   to the existing `user` row with the same email (`trustedProviders:
   ["google"]`) — no duplicate user, customers/transactions preserved.
   The `0005` migration sets `email_verified = true` for rows that had a
   password credential, which v1.7 requires before implicit linking.
4. The client persists the session token from the `set-auth-token` response
   header and sends it as `Authorization: Bearer <token>` (unchanged
   contract). `/auth/me` and `/auth/logout` keep working.

## Required env (Worker secrets/vars, plus web/Expo equivalents)

- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — Google Cloud OAuth client
  (authorize the web origin and the Expo redirect URI).
- `BETTER_AUTH_SECRET` — Better Auth signing secret (generate with
  `openssl rand -base64 32`).
- `BETTER_AUTH_URL` — public API origin (defaults to
  `http://localhost:8787` for local dev).
- `TRUSTED_ORIGINS` — comma-separated web origins (already configured).

The API fails fast at startup when the Google/secret vars are missing.

## Linking rules

- The Google email MUST exactly match the stored user email. A different
  Google email creates a separate user and does NOT touch existing data.
- Users who have not linked must sign in with the same email via Google to
  regain access. There is no password fallback after the purge.

## Client changes

- Web: `apps/web/lib/auth.ts` (Better Auth client, Google button, token in
  `localStorage`, `useAuth` loads `/auth/me`). Password pages removed.
- Mobile: `apps/app/lib/auth-session.ts` (`@better-auth/expo`, system
  browser + deep link, token in SecureStore/AsyncStorage). Password screens
  removed. Data screens still query Supabase directly (follow-up in the
  previous revision of this doc, now superseded for auth).

## Rollback

Re-enabling passwords is impossible without hashes — restore the `account`
table from the pre-cutover backup. OAuth sessions stay valid. Point
clients back only after restore.

## Verification

- API: `bun run test` covers `410`s, session revocation, and auth audit
  emissions (`apps/api/src/test/auth*.test.ts`).
- Staging (required before production cutover): complete a Google sign-in
  with the same email, `GET /auth/me` -> `200` with the original `user.id`,
  customers/transactions intact; a different Google email must NOT touch
  the existing user.
