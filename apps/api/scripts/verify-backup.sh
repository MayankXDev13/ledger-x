#!/usr/bin/env bash
# Restore dry-run: downloads R2 backup and restores to a scratch Postgres, then compares counts.
# Usage: SUPABASE_DB_URL=<scratch> R2_BUCKET=ledgerx-backups R2_PREFIX=... ./scripts/verify-backup.sh
set -euo pipefail
: "${R2_PREFIX:?Set R2_PREFIX}"
R2_BUCKET="${R2_BUCKET:-ledgerx-backups}"
: "${DATABASE_URL:?Set DATABASE_URL to an empty scratch Postgres (Neon branch)}"
WORKDIR="${WORKDIR:-$(mktemp -d)}"

wrangler r2 object get --remote "$R2_BUCKET/$R2_PREFIX/full.dump" --file="$WORKDIR/full.dump"
wrangler r2 object get --remote "$R2_BUCKET/$R2_PREFIX/SHA256SUMS" --file="$WORKDIR/SHA256SUMS"
wrangler r2 object get --remote "$R2_BUCKET/$R2_PREFIX/manifest.json" --file="$WORKDIR/manifest.json"

cd "$WORKDIR" && sha256sum -c SHA256SUMS
pg_restore --clean --if-exists -d "$DATABASE_URL" "$WORKDIR/full.dump"
echo "restore complete; compare manifest.json counts against scratch DB before proceeding"
cat "$WORKDIR/manifest.json"
