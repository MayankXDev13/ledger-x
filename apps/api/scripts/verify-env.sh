#!/usr/bin/env bash
# Verifies Neon + R2 + Better Auth env scaffolding without requiring live credentials
# to hold secrets. Exits non-zero when required config is missing.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
API_DIR="$ROOT/apps/api"
# When invoked from apps/api/scripts, ROOT above resolves to apps/; handle both layouts.
if [ ! -f "$API_DIR/wrangler.jsonc" ] && [ -f "$ROOT/wrangler.jsonc" ]; then
  API_DIR="$ROOT"
elif [ ! -f "$API_DIR/wrangler.jsonc" ]; then
  API_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
fi

fail=0
check() {
  if eval "$1"; then
    echo "ok - $2"
  else
    echo "missing - $2"
    fail=1
  fi
}

check "grep -q '\"bucket_name\": \"ledgerx-backups\"' \"$API_DIR/wrangler.jsonc\"" "wrangler.jsonc R2 bucket ledgerx-backups"
check "grep -q '\"binding\": \"HYPERDRIVE\"' \"$API_DIR/wrangler.jsonc\"" "wrangler.jsonc Hyperdrive binding"
check "grep -q 'BETTER_AUTH_SECRET' \"$API_DIR/.dev.vars.example\"" "Better Auth secret in .dev.vars.example"
check "grep -q 'DATABASE_URL' \"$API_DIR/.dev.vars.example\"" "Neon DATABASE_URL in .dev.vars.example"
check "test -x \"$API_DIR/scripts/backup-supabase-to-r2.sh\"" "backup script executable"
check "test -f \"$API_DIR/scripts/import-supabase-to-neon.ts\"" "import script present"

if [ "$fail" -ne 0 ]; then
  echo "env scaffolding incomplete"
  exit 1
fi
echo "env scaffolding verified (live wrangler/Neon checks run separately with credentials)"
