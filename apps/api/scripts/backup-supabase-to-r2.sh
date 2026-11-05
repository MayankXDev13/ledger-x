#!/usr/bin/env bash
# Full logical backup of Supabase Postgres -> Cloudflare R2 with checksum manifest.
# Usage:
#   SUPABASE_DB_URL=postgres://... R2_PREFIX=ledgerx-backups/2026-01-01T00-00-00Z ./scripts/backup-supabase-to-r2.sh
# Requires: pg_dump, psql, sha256sum, wrangler (logged in).
set -euo pipefail

: "${SUPABASE_DB_URL:?Set SUPABASE_DB_URL to the Supabase Postgres connection string}"
R2_BUCKET="${R2_BUCKET:-ledgerx-backups}"
R2_PREFIX="${R2_PREFIX:-ledgerx-backups/$(date -u +%Y-%m-%dT%H-%M-%SZ)}"
WORKDIR="${WORKDIR:-$(mktemp -d)}"

echo "workdir: $WORKDIR"
echo "target: r2://$R2_BUCKET/$R2_PREFIX"

pg_dump "$SUPABASE_DB_URL" --format=custom --file="$WORKDIR/full.dump"
pg_dump "$SUPABASE_DB_URL" --data-only --column-inserts --file="$WORKDIR/data.sql"

TABLES="auth.users contacts ledger_entries contact_tags contact_tag_map transaction_tags transaction_tag_map"
{
  echo "{"
  echo "  \"timestamp\": \"$(date -u +%FT%TZ)\","
  echo "  \"tables\": {"
  first=1
  for t in $TABLES; do
    schema_table="$t"
    # auth.users lives in auth schema; others in public
    count=$(psql "$SUPABASE_DB_URL" -tAX -c "SELECT count(*) FROM $schema_table;" 2>/dev/null || echo "unknown")
    if [ "$first" -eq 1 ]; then first=0; else echo ","; fi
    printf '    "%s": {"rows": "%s"}' "$t" "$count"
  done
  echo ""
  echo "  }"
  echo "}"
} > "$WORKDIR/manifest.json"

sha256sum "$WORKDIR/full.dump" "$WORKDIR/data.sql" "$WORKDIR/manifest.json" > "$WORKDIR/SHA256SUMS"

wrangler r2 object put --remote "$R2_BUCKET/$R2_PREFIX/full.dump" --file="$WORKDIR/full.dump"
wrangler r2 object put --remote "$R2_BUCKET/$R2_PREFIX/data.sql" --file="$WORKDIR/data.sql"
wrangler r2 object put --remote "$R2_BUCKET/$R2_PREFIX/manifest.json" --file="$WORKDIR/manifest.json"
wrangler r2 object put --remote "$R2_BUCKET/$R2_PREFIX/SHA256SUMS" --file="$WORKDIR/SHA256SUMS"

echo "backup uploaded to r2://$R2_BUCKET/$R2_PREFIX"
echo "verify with: ./scripts/verify-backup.sh R2_BUCKET=$R2_BUCKET R2_PREFIX=$R2_PREFIX DATABASE_URL=<scratch-pg-url>"
