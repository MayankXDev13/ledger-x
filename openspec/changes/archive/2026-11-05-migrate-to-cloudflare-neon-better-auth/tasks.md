# Tasks

## 1. Backup to R2 and Neon scaffolding

- [x] 1.1 Provision Neon project/branch + R2 bucket (`ledgerx-backups`) and verify `wrangler r2 bucket list` and Neon connect string work from `.dev.vars` (no secrets committed)
- [x] 1.2 Add backup script (`pg_dump` custom + manifest with row counts + sha256) uploading to R2 and verify restore dry-run to scratch PG matches manifest counts
- [x] 1.3 Add Drizzle Neon schema for remapped domain tables and verify `db:generate` + `db:migrate` apply cleanly on empty Neon branch
- [x] 1.4 Document backup/restore runbook (`docs/backup-r2.md`) and verify documented restore command reproduces counts on scratch target

## 2. Better Auth replacement

- [x] 2.1 Add Better Auth + Drizzle tables (`user`, `session`, `account`, `verification`) and Hono `auth.api.getSession` verifier, verify unit test rejects Supabase token with `401` and accepts Better Auth token
- [x] 2.2 Replace web auth (`lib/supabase.ts`, login/signup/reset pages, `lib/api.ts` token fetch) with Better Auth client and verify `GET /auth/me` returns `id/email` after signup/login in preview
- [x] 2.3 Update mobile token provider (`apps/app`) to Better Auth session token and verify contract test for protected route passes with new Bearer
- [x] 2.4 Add password-reset email flow for migrated users and verify reset link login works and old session is revoked; document reset UX in `docs/auth-migration.md` and verify docs steps work on preview

## 3. Supabase to Neon data import

- [x] 3.1 Implement idempotent import script (users → reset-pending preserving IDs, then customers/transactions/tags/maps with `ON CONFLICT DO NOTHING/UPDATE`) and verify double-run produces identical row counts
- [x] 3.2 Validate ownership relink (`user_id` → Better Auth `user.id`, no `auth.users`/RLS refs) and verify migrated user sees exactly their own data after reset login
- [x] 3.3 Extend API contract tests to cover Better Auth + ownership scoping and verify `bun run test` passes without live Supabase/Postgres

## 4. Cloudflare Pages + Workers deploy

- [x] 4.1 Configure Pages build for `apps/web` (`NEXT_PUBLIC_API_URL` required, `@cloudflare/next-on-pages` if needed) and verify preview Pages URL calls preview Worker with no localhost fallback
- [x] 4.2 Rewire `apps/api/wrangler.jsonc` Hyperdrive to Neon + `TRUSTED_ORIGINS`/secrets and verify Worker answers on custom domain with CORS reflecting allowlist
- [x] 4.3 Add deploy smoke script (public health, `/auth/me` 401/200, CRUD round-trip) and verify it passes on preview and gates production cutover

## 5. Audit logging

- [x] 5.1 Add `audit_logs` Drizzle table + writer (actor, action, entity_type/id, metadata, ip/ua, timestamp) and verify migration applies and inserts succeed without logging passwords
- [x] 5.2 Emit auth audit events (signup/login/logout/reset/revoke) and verify failed login + reset completion create entries with correct outcome
- [x] 5.3 Emit data-mutation audit events (customer/transaction/tag CRUD) excluding reads and verify list-view performs zero inserts while update+delete leave ordered entries
- [x] 5.4 Add scoped `GET /audit-logs` (owner-only, time-range paginated) and verify cross-user request returns `404/401` with error envelope; document retention/query in `docs/audit-logs.md` and verify doc queries run as written

## 6. Cutover, rollback, and decommission

- [x] 6.1 Execute freeze → backup → import → validate (counts + spot checks) on prod and verify cutover proceeds only on passing validation, else stays on Supabase
- [x] 6.2 Cut DNS/env to prod Pages/Workers + send reset emails, verify prod smoke passes and Supabase stays read-only for rollback window
- [x] 6.3 Remove Supabase runtime deps (`@supabase/supabase-js` auth paths, RLS docs, Supabase env) and verify `grep -r supabase apps/web apps/api` shows no runtime auth usage and `bun run build && bun run test` pass
