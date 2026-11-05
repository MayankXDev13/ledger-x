# Supabase backup to Cloudflare R2

Full logical backup before any Neon import. The import is blocked until the
backup verifies.

## Prerequisites

- `pg_dump`, `psql` installed, Supabase connection string (`SUPABASE_DB_URL`)
- `wrangler` logged in; R2 bucket `ledgerx-backups` exists
  (`wrangler r2 bucket create ledgerx-backups`)

## Backup

```bash
cd apps/api
SUPABASE_DB_URL="postgres://..." ./scripts/backup-supabase-to-r2.sh
```

Uploads to `r2://ledgerx-backups/<timestamp>/`:
`full.dump`, `data.sql`, `manifest.json` (row counts), `SHA256SUMS`.

## Verify (restore dry-run)

```bash
DATABASE_URL="postgres://<empty-scratch-db>" \
R2_PREFIX="ledgerx-backups/<timestamp>" \
./scripts/verify-backup.sh
```

Restores the dump to an empty Postgres (use a fresh Neon branch), checks
checksums, and prints `manifest.json` for count comparison. Proceed only on
success.

## Retention

Keep every pre-cutover backup for at least 90 days. The rollback window keeps
Supabase read-only; the R2 backup is the source of truth if both fail.
