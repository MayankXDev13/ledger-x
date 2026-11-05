# Proposal

## Why

Ledger-X currently couples hosting, auth, and data to Supabase (Supabase Auth + Supabase Postgres, `@supabase/supabase-js` in `apps/web` and `apps/api`). The goal is to run web on Cloudflare Pages, API on Cloudflare Workers, data on Neon Postgres via Drizzle ORM, and auth on Better Auth — with zero silent data loss, a verified R2 backup before cutover, and auditable auth/data changes.

## What Changes

- Deploy `apps/web` (Next.js) to Cloudflare Pages and `apps/api` (Hono Worker) to Cloudflare Workers with production env wiring (`NEXT_PUBLIC_API_URL`, `TRUSTED_ORIGINS`, Hyperdrive/Neon URL, Better Auth secrets).
- Replace Supabase Auth with Better Auth (email/password; session-token Bearer for API): new Better Auth schema in Neon via Drizzle, new login/signup/session/reset flows in web + mobile-adjacent API, removal of `@supabase/supabase-js` auth paths.
- **BREAKING**: Supabase access tokens no longer accepted by the API; existing sessions are invalidated at cutover. All users migrate via password-reset (no password-hash import) — users set a new password on first post-migration login.
- Migrate all Postgres data from Supabase to Neon (customers, transactions, tags, tag maps + user directory): full `pg_dump` backup stored in Cloudflare R2 with checksum + restore verification before any write to Neon, then schema remap (`auth.users` → Better Auth `user` table, `user_id` relinking) and idempotent import.
- Add persistent audit logs for auth events (login/logout/signup/password-reset/session revoke) and data mutations (create/update/delete on customers, transactions, tags, tag associations), stored in Neon via Drizzle with actor, action, entity, timestamp, and request metadata.
- Decommission Supabase runtime dependency (code + env) after verified Neon cutover; Supabase kept read-only only as rollback source until acceptance.

## Capabilities

### New Capabilities

- `cloudflare-deployment`: Web on Pages + API on Workers deploy, env, domains, and rollback behavior.
- `user-auth`: Better Auth email/password auth, sessions, password-reset migration, and API Bearer verification.
- `neon-migration`: Neon Postgres via Drizzle, R2 backup (dump + manifest + checksum), Supabase→Neon data import, and cutover/rollback.
- `audit-logging`: Append-only audit log for auth + financial-data mutations, retention, and query access.

### Modified Capabilities

- `web-api-integration`: Bearer authentication requirement changes from "valid Supabase access token" to "valid Better Auth session token"; ownership scoping now keys off Better Auth `user.id`; error/validation/CORS/connection behavior otherwise unchanged.

## Impact

- Code: `apps/web/lib/supabase.ts`, `apps/web/lib/api.ts`, all `apps/web/app/*` auth hooks/pages; `apps/api/src/middleware/authmiddleware.ts`, `apps/api/src/lib/supabase.ts`, `apps/api/src/routes/auth.ts`, `apps/api/src/db/schema.ts`, `drizzle/` migrations, `wrangler.jsonc` (Hyperdrive → Neon, secrets), `apps/app` Supabase client + `supabase-schema.sql` docs.
- Systems: Supabase Auth + Supabase Postgres (source, then decommissioned); Neon Postgres (target); Cloudflare Pages/Workers + R2 (backup bucket); Better Auth (new dependency).
- Compatibility: **BREAKING** auth cutover; API route shapes and error envelope unchanged; mobile app (`apps/app`) must switch token provider to stay compatible.
