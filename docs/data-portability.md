# Data portability: exports, archive, and account deletion

All endpoints require `Authorization: Bearer <session-token>`; unauthenticated
calls return `401` with the JSON error envelope. Amounts are whole currency
units (rupees) formatted with two decimals; timestamps are ISO 8601. Every
export excludes soft-deleted rows and rows flagged `is_sample`.

## CSV exports

```
GET /exports/customers.csv
GET /exports/transactions.csv
```

Both respond `200` with `Content-Type: text/csv; charset=utf-8` and an
`attachment` content-disposition (`ledger-x-customers-YYYY-MM-DD.csv` /
`ledger-x-transactions-YYYY-MM-DD.csv`). The first row is a header row; fields
containing commas, quotes, or newlines are quoted per RFC 4180.

Customers header: `id,name,phone,created_at,updated_at`

Transactions header:
`id,customer_id,customer_name,type,amount,payment_method,note,created_at,updated_at`

Example row: `t1,c1,Ramesh,debit,1250.00,upi,part payment,2026-01-05T10:00:00.000Z,2026-01-05T10:00:00.000Z`

The transaction export resolves the customer name from the caller's own
customers; other users' data is unreachable by construction.

## Account archive (JSON)

```
GET /account/export
```

Returns one JSON document with everything owned by the caller, including
soft-deleted rows flagged `"deleted": true`:

```json
{
  "exportedAt": "2026-11-07T09:00:00.000Z",
  "user": { "id": "user-1", "email": "user@example.com" },
  "customers": [ { "id": "c1", "name": "Ramesh", "deleted": false, "...": "..." } ],
  "transactions": [ { "id": "t1", "deleted": false, "...": "..." } ]
}
```

Sample rows (`is_sample: true`) are excluded here too. A successful archive
writes an `account.export` audit entry.

## Account deletion

```
DELETE /account
Content-Type: application/json

{ "confirm": "DELETE" }
```

- Missing or wrong confirmation → `400`, nothing is deleted, and an
  `account.delete_failed` audit entry is written.
- Correct confirmation → an `account.delete` audit entry is written **before**
  the hard delete of the Better Auth `user` row; `session`, `account`,
  `customers`, and `transactions` cascade, and audit rows survive because
  `audit_logs` has no foreign key on the actor.
- After deletion the session token no longer authenticates (`401`), and other
  users' data is untouched.

The deletion entry retains only the pseudonymous actor id — no PII survives the
cascade. The web and mobile settings screens both gate this action behind
typing `DELETE` explicitly.
