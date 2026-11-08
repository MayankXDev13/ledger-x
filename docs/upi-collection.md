# UPI collection

Ledger-X never moves money and is not a payment aggregator. The user's UPI ID
(VPA) is stored as configuration; collection links and QR codes are generated
on-device from that configuration plus the outstanding balance, and **payment
completion is always recorded manually** as a payment entry.

## Configuration

```
GET /settings
PUT /settings
Authorization: Bearer <session-token>

{ "upiId": "ramesh@okhdfcbank", "payeeName": "Ramesh Kirana" }
```

- The VPA must match `handle@provider` (letters only after the `@`); invalid
  values return `400`.
- Both fields are nullable — clearing them disables UPI actions.
- Settings are per-user; another user's settings are never readable or
  writable.
- `PUT /settings` also accepts `onboardingCompleted` / `onboardingDismissed`
  flags used by the first-run flow.

## Intent URI

The QR payload and shareable link are the standard UPI intent:

```
upi://pay?pa=ramesh%40okhdfcbank&pn=Ramesh%20Kirana&am=1250.00&cu=INR&tn=Khata%20balance%20for%20Suresh
```

- `am` is always two decimals in whole rupees (the ledger's unit).
- `tn` (note) is URL-encoded when present.
- Web helper: `apps/web/lib/upi.ts`; mobile helper: `apps/app/lib/upi.ts` —
  both unit-tested to keep the two platforms byte-identical.

## Collection view

```
GET /collection?sort=amount|age
Authorization: Bearer <session-token>
```

Returns customers with a **positive** balance only (zero and negative balances
are excluded), each with the outstanding amount, the oldest unpaid credit date,
and its age in days computed FIFO:

```json
{
  "data": [
    {
      "customerId": "c1",
      "name": "Suresh",
      "phone": "+91 90000 00001",
      "outstanding": 1250,
      "oldestUnpaidCreditAt": "2026-10-01T10:00:00.000Z",
      "ageDays": 37
    }
  ],
  "totalReceivables": 1250,
  "sort": "amount"
}
```

Web (`/collection`) offers copy-link and a QR dialog per customer; mobile (the
Collect tab) opens the UPI intent directly with a QR fallback. If no VPA is
configured, UPI actions are disabled with a pointer to settings.

Recording the collected amount is a manual step by design: the customer's
payment entry (debit + method) is what reduces the balance; scanning the QR
does not create an entry.
