# Design

## Context

See proposal.md Why. Current state (observed):
- `apps/web`: Next.js 16 + `lib/supabase.ts` (`@supabase/supabase-js`), `lib/api.ts` axios client attaching `supabase.auth.getSession()` token.
- `apps/api`: Hono on Workers (`src/index.ts`, `src/app.ts`), `middleware/authmiddleware.ts` Bearer check via `deps.verifyToken`, `lib/supabase.ts`, `db/schema.ts` Drizzle PG (customers, transactions, transaction_tags, tag map) with `userId` UUID, `wrangler.jsonc` Hyperdrive binding + custom domain `api.ledgex.mayankxdev.shop`.
- `apps/app`: Expo + `supabase-schema.sql` (contacts/ledger_entries, RLS on `auth.uid()`).
- Target: Pages (web) + Workers (API), Neon PG via Drizzle, Better Auth, R2 backup, Neon audit table. Users chose: Pages+Workers split, password-reset migration, full backup-then-migrate, auth+data audit scope, R2 backup store.

## Goals / Non-Goals

**Goals:**
- Zero-loss Supabase→Neon cutover with R2-verified backup and idempotent import.
- Better Auth email/password with session Bearer for web + API (+ mobile token swap).
- Reproducible Pages/Workers deploys with env parity and rollback.
- Append-only audit log for auth + mutations without logging reads or secrets.

**Non-Goals:**
- Password-hash import or zero-downtime live dual-write; OAuth/social providers (not requested); long-term Supabase retention beyond rollback window; full read-access logging.

## Decisions

1. **Web on Cloudflare Pages (Next.js)**: Keep Next.js, deploy via Pages. Use `@cloudflare/next-on-pages` adapter if dynamic routes need edge runtime; else static + `NEXT_PUBLIC_API_URL` baked at build time. Alternative (Workers Static Assets single Worker) rejected — user chose Pages+Workers split, keeps `apps/web` runnable via `next dev/build`.
2. **API on Workers + Hyperdrive → Neon**: Keep Hono, repoint Hyperdrive ID/connection string from Supabase PgBouncer to Neon pooled URL. Keep request-scoped `pg` client close pattern (existing spec) to satisfy Workers CPU/connection limits. Alternative (direct Neon serverless driver) deferred — Hyperdrive preserves current `wrangler.jsonc` shape and caching.
3. **Better Auth + Drizzle adapter in Neon**: Add `user/session/account/verification` tables via Drizzle (`better-auth` drizzle schema), use Better Auth Hono integration for `/api/auth/*` mounted in Workers, replace `verifyToken` with `auth.api.getSession`. Password-reset migration: import `id,email,emailVerified,name,createdAt` from `auth.users`, force `emailVerified=false` + reset flow; no hash import. Alternative (hash import via custom scrypt decode) rejected — Supabase hashes are bcrypt with project pepper, unreliable.
4. **Backup to R2 first**: `pg_dump --format=custom` + `pg_dump --data-only --column-inserts` manifest (row counts per table, sha256) uploaded to R2 (`ledgerx-backups/<timestamp>/`) via Wrangler R2/S3 API; verify by restoring to ephemeral Neon branch or local PG and comparing counts. Alternative (Supabase dashboard backup only) rejected — not versioned in our control, no checksum gate.
5. **Drizzle as single migration path**: Remap `auth.users.id → user.id` preserving UUIDs where possible (Better Auth text IDs — store Supabase UUID as `id` string to preserve FKs); rewrite `user_id` FKs to `user.id`; drop RLS (enforce ownership in Hono middleware as today). Import script idempotent via `ON CONFLICT DO NOTHING/UPDATE` keyed by primary key.
6. **Audit log table in Neon**: New `audit_logs(id, actor_user_id, action, entity_type, entity_id, metadata JSONB, ip, user_agent, created_at)` via Drizzle; written in API middleware/service layer post-commit for auth + mutations only; paginated `GET /audit-logs?from&to` scoped to caller. Alternative (Cloudflare Workers Logs only) rejected — need user-scoped queryable history.

## Risks / Trade-offs

- [Risk] Supabase UUID vs Better Auth string IDs break FKs → Mitigation: use text PK carrying UUID string, import preserves values, Drizzle relations updated + validated by FK checks.
- [Risk] R2 backup corrupt/incomplete → Mitigation: checksum + restore dry-run gate; import blocked until pass.
- [Risk] Session invalidation anger / support load from forced reset → Mitigation: pre-migration email campaign, in-app banner, staggered cutover, clear reset UX.
- [Risk] Workers + Neon latency/connection exhaustion → Mitigation: Hyperdrive pooling, request-scoped close, `pageSize ≤100` validation retained.
- [Risk] Mobile (`apps/app`) left on Supabase client → Mitigation: swap to Better Auth token fetch in same change; contract tests cover new Bearer.
- [Trade-off] No live dual-write means brief write-freeze window during final dump→import→cutover; accepted for correctness.

## Migration Plan

1. Provision Neon project/branch + R2 bucket (`ledgerx-backups`), wire Hyperdrive to Neon preview, add Better Auth secrets to `.dev.vars`/Wrangler secrets.
2. Freeze writes (maintenance banner), `pg_dump` Supabase → R2 + manifest + sha256, restore-verify on scratch target, record counts.
3. Apply Drizzle migrations to Neon (Better Auth + remapped domain + `audit_logs`), run import script (users → reset-pending, then domain tables), validate counts + spot-check ownership.
4. Deploy API Worker (Better Auth) + Pages web (new auth UI) to preview, smoke test (signup/login/reset/me, CRUD, audit write, 401 on Supabase token).
5. Cutover DNS/env (`NEXT_PUBLIC_API_URL`, `TRUSTED_ORIGINS`) to prod, send reset emails, monitor; keep Supabase read-only for rollback window, then decommission code/env (`@supabase/supabase-js`, RLS docs).

Rollback: point env/DNS back to Supabase-backed Worker deployment (prior Wrangler version) if validation fails; Neon writes discarded; R2 backup remains source of truth.

## Open Questions

- Neon region/branch topology and R2 bucket name/retention — can default (nearest region, `ledgerx-backups`, 90-day) without changing specs/tasks.
- Reset-email provider (Resend/SES via Better Auth) — pluggable; default to existing email infra.
