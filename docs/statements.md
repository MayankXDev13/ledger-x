# Customer statements

The statement model is computed by the API so the on-screen list and the
printed/shared document always agree.

## Endpoint

```
GET /statements/customers/:id?start=2026-01-01&end=2026-01-31
Authorization: Bearer <session-token>
```

- `start`/`end` are optional; omit both for a full-history statement.
- The response includes the balance immediately before `start` as
  `openingBalance`, so partial ranges are correct.
- `entries` carry a per-row `runningBalance` over the customer's **full**
  history (the window is computed before pagination/filtering on the server).
- Soft-deleted entries are excluded, matching the transaction list.
- Another user's customer id returns `404`.

Response shape:

```json
{
  "customer": { "id": "c1", "name": "Ramesh", "phone": "+91 90000 00000" },
  "start": "2026-01-01T00:00:00.000Z",
  "end": "2026-01-31T23:59:59.999Z",
  "openingBalance": 500,
  "closingBalance": 1300,
  "totalCredit": 1000,
  "totalDebit": 200,
  "entries": [
    {
      "id": "t1",
      "date": "2026-01-05T10:00:00.000Z",
      "type": "credit",
      "amount": 1000,
      "paymentMethod": null,
      "note": "Goods",
      "runningBalance": 1500
    }
  ]
}
```

## Rendering and file naming

Both platforms render the same document concept and share one naming
convention:

```
<customer-slug>-statement-<start|all-time>_<end|all-time>.pdf
```

Examples: `ramesh-kumar-statement-2026-01-01_2026-01-31.pdf`,
`ramesh-kumar-statement-all-time_all-time.pdf`.

- **Web** (`/customers/statement?id=...`): browser print dialog → PDF. A
  dedicated `@media print` stylesheet hides the app chrome, forces light
  colors, and sets A4 margins.
- **Mobile** (`app/customers/statement.tsx`): `expo-print` renders the shared
  HTML template into a PDF, `expo-sharing` opens the OS share sheet with the
  filename above. The on-screen preview shows the same period, totals, and
  running balances that the PDF contains.

Payment entries (debits with a payment method) are badged with the method
(Cash/UPI/Other) in both renderings.
