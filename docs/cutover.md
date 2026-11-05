# Cutover runbook (freeze -> backup -> import -> validate -> switch)

Requires: `SUPABASE_DB_URL`, `DATABASE_URL` (Neon), R2 access, DNS control.

1. **Freeze writes**: put the app in maintenance mode (banner). Supabase stays
   readable.
2. **Backup**: `docs/backup-r2.md` — dump Supabase to
   `r2://ledgerx-backups/<timestamp>/`, then `verify-backup.sh` on a scratch
   DB. Stop on any failure.
3. **Migrate schema**: `bun run db:migrate` (or `db:migrate:neon`) against the
   Neon target.
4. **Import**: `SUPABASE_DB_URL=... DATABASE_URL=... bun run import:supabase`
   (idempotent — safe to re-run).
5. **Validate**: `... bun scripts/validate-migration.ts`. Cut over only when
   every check passes; otherwise traffic stays on Supabase.
6. **Smoke (preview)**: deploy Worker + Pages to preview, run `smoke.sh`.
7. **Switch**: point `NEXT_PUBLIC_API_URL` / DNS at production, send reset
   emails (see `docs/auth-migration.md`). Keep Supabase read-only for the
   rollback window.
8. **Rollback**: point DNS/env back to the previous Worker deployment and the
   Supabase-backed API; Neon writes are discarded.

Acceptance: validation green, smoke green on prod, spot-checked users see
their own data after password reset.
