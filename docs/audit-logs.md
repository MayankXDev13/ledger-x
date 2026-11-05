# Audit logs

Append-only trail in Neon's `audit_logs` table (Drizzle schema in
`apps/api/src/db/schema.ts`), written via `writeAudit()` in
`apps/api/src/lib/audit.ts`. Audit writes never fail the request.

## Recorded events

- Auth: `auth.signup`, `auth.login`, `auth.login_failed`, `auth.logout`,
  `auth.password_reset_request`, `auth.password_reset`
  (change-password is logged as `auth.password_reset` with
  `metadata.via = "change-password"`). Failed logins record the email, never
  the password.
- Data mutations only: `customer.*`, `transaction.*`, `tag.*`,
  `tag.associate`, `tag.dissociate` (create/update/delete).
  Reads (`GET` list/detail/dashboard) create no entries.

## Query

`GET /audit-logs?from=&to=&page=&pageSize=` (owner-scoped, chronological) and
`GET /audit-logs/:id`. Cross-user access returns `404`. Example:

```bash
curl "$API_URL/audit-logs?pageSize=20" -H "Authorization: Bearer $TOKEN"
```

## Retention

Keep entries for at least 1 year. No silent deletion; no update/delete API.
Include `audit_logs` in the R2 backup (`full.dump` covers it).
