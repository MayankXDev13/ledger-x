#!/usr/bin/env bash
# Post-deploy smoke test for the Workers API (gates production cutover).
# Usage: API_URL=https://api.ledgex.mayankxdev.shop ./scripts/smoke.sh
set -euo pipefail
API_URL="${API_URL:-http://localhost:8787}"
EMAIL="smoke-$(date +%s)@example.com"
PASS="smoke-pass-123"

fail() { echo "SMOKE FAIL: $1"; exit 1; }

# 1. Protected route without token -> 401
code=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/auth/me")
[ "$code" = "401" ] || fail "/auth/me without token returned $code"

# 2. Old Supabase-style token rejected -> 401
code=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer supabase-legacy-token" "$API_URL/auth/me")
[ "$code" = "401" ] || fail "legacy token returned $code"

# 3. Signup -> 201 with session token
signup=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/auth/signup" -H "Content-Type: application/json" -d "{\"email\":\"$EMAIL\",\"password\":\"$PASS\"}")
body=$(echo "$signup" | head -n -1); code=$(echo "$signup" | tail -n 1)
[ "$code" = "201" ] || fail "signup returned $code: $body"
token=$(echo "$body" | python3 -c "import json,sys; print(json.load(sys.stdin)['token'])")

# 4. /auth/me with token -> 200
me=$(curl -s "$API_URL/auth/me" -H "Authorization: Bearer $token")
echo "$me" | grep -q "$EMAIL" || fail "/auth/me mismatch: $me"

# 5. Customer CRUD round-trip with audit
cust=$(curl -s -X POST "$API_URL/customers" -H "Authorization: Bearer $token" -H "Content-Type: application/json" -d '{"name":"Smoke","phone":"123"}')
cid=$(echo "$cust" | python3 -c "import json,sys; print(json.load(sys.stdin)['id'])")
[ -n "$cid" ] || fail "customer create failed: $cust"
code=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/customers/$cid" -H "Authorization: Bearer $token")
[ "$code" = "200" ] || fail "customer get returned $code"
code=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/audit-logs" -H "Authorization: Bearer $token")
[ "$code" = "200" ] || fail "audit-logs returned $code"

# 6. Logout revokes token
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API_URL/auth/logout" -H "Authorization: Bearer $token")
[ "$code" = "200" ] || fail "logout returned $code"
code=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/auth/me" -H "Authorization: Bearer $token")
[ "$code" = "401" ] || fail "revoked token returned $code"

echo "SMOKE OK ($API_URL)"
