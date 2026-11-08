# Dashboard analytics

## Endpoint

```
GET /dashboard/analytics
Authorization: Bearer <session-token>
```

One round trip returns all three dashboard blocks. All queries are scoped to
the authenticated user and exclude soft-deleted rows. Aggregates **include**
sample rows while present, so the numbers always match the entries the user
sees (see `docs/onboarding-and-sample-data.md`).

```json
{
  "trend": [
    { "month": "2025-12", "credit": 0, "debit": 0 },
    { "month": "2026-01", "credit": 15000, "debit": 4000 }
  ],
  "topDebtors": [
    {
      "customerId": "c1",
      "name": "Suresh",
      "outstanding": 1250,
      "ageDays": 37
    }
  ],
  "aging": { "0-30": 500, "31-60": 250, "60+": 500 },
  "totalReceivables": 1250
}
```

## Contract details

- **`trend` is always 12 points**, zero-filled from generated month keys, so
  empty months appear as zeros. Months are **UTC calendar months** for
  determinism (`YYYY-MM`); clients label them with a name ("Jan 26") and the
  UI does not promise local-midnight boundaries. Users near midnight in
  non-UTC timezones may see an entry land in the neighboring month — this is a
  documented trade-off.
- **`topDebtors`** is ordered by outstanding balance (descending), capped at
  10, and reuses the FIFO aging helper from `GET /collection`, so the age shown
  here matches the collection view.
- **`aging`** buckets are `0-30`, `31-60`, `60+` days by oldest-unpaid-credit
  age; the sums equal `totalReceivables`.

Web renders the trend as a credit/paid bar chart, top debtors as a linked list,
and aging as three colored cards, each with an explicit empty state. Mobile
renders the same three blocks on the dashboard tab with the same data source.
