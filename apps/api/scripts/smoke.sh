#!/usr/bin/env bash
# Post-deploy smoke test for the Workers API (gates production cutover).
#
# Google is the sole sign-in method (see docs/auth-migration.md), so the
# password endpoints are gone. The authenticated half of the gate therefore
# needs a real session token: sign in once through Google and pass the
# token in as SMOKE_TOKEN. Without it, only the unauthenticated checks run
# and the script says so rather than reporting a false pass.
#
# Usage:
#   API_URL=https://server-v2.mayankxdev13.workers.dev \
#   SMOKE_TOKEN=<session-token> ./scripts/smoke.sh
set -euo pipefail
API_URL="${API_URL:-http://localhost:8787}"
TOKEN="${SMOKE_TOKEN:-}"

fail() { echo "SMOKE FAIL: $1"; exit 1; }

# 1. Protected route without token -> 401
code=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/auth/me")
[ "$code" = "401" ] || fail "/auth/me without token returned $code"

# 2. Old Supabase-style token rejected -> 401
code=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer supabase-legacy-token" "$API_URL/auth/me")
[ "$code" = "401" ] || fail "legacy token returned $code"

# 3. The removed password flows stay gone -> 410
for path in signup login request-reset; do
  code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API_URL/auth/$path" \
    -H "Content-Type: application/json" -d '{"email":"x@example.com","password":"y"}')
  [ "$code" = "410" ] || fail "/auth/$path returned $code, expected 410"
done

# 4. The Google sign-in entry point is served
code=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/api/auth/ok")
[ "$code" = "200" ] || fail "/api/auth/ok returned $code"
code=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/api/auth/redirect/google")
[ "$code" = "302" ] || fail "/api/auth/redirect/google returned $code, expected 302"

if [ -z "$TOKEN" ]; then
  echo "SMOKE OK (unauthenticated checks only; set SMOKE_TOKEN for the authenticated half)"
  exit 0
fi

# 6. /auth/me with a session token -> 200
me=$(curl -s "$API_URL/auth/me" -H "Authorization: Bearer $TOKEN")
echo "$me" | python3 -c "import json,sys; d=json.load(sys.stdin); assert d.get('email'), d" \
  || fail "/auth/me mismatch: $me"

# 7. Customer CRUD round-trip
cust=$(curl -s -X POST "$API_URL/customers" -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" -d '{"name":"Smoke","phone":"123"}')
cid=$(echo "$cust" | python3 -c "import json,sys; print(json.load(sys.stdin).get('id',''))" 2>/dev/null || echo "")
[ -n "$cid" ] || fail "customer create failed: $cust"
code=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/customers/$cid" -H "Authorization: Bearer $TOKEN")
[ "$code" = "200" ] || fail "customer get returned $code"
code=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE "$API_URL/customers/$cid" -H "Authorization: Bearer $TOKEN")
[ "$code" = "200" ] || fail "customer delete returned $code"

# 8. Audit log is readable
code=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/audit-logs" -H "Authorization: Bearer $TOKEN")
[ "$code" = "200" ] || fail "audit-logs returned $code"

echo "SMOKE OK ($API_URL)"
