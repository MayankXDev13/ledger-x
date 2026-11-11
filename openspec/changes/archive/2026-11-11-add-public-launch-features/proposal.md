# Proposal

## Why

Ledger-X today records customers and credit/debit entries, but it stops where a shopkeeper's real workflow begins: it cannot record money coming back with a method, cannot prove to a customer what they owe in a shareable form, cannot keep working when the network dies in the back of the shop, cannot export or delete the user's own data, and cannot collect via UPI. That is enough for a personal tool but not for a public khata product competing with Khatabook/OkCredit. This change captures the full feature roadmap agreed in the product interview so the capabilities are specified, sequenced, and ready to implement in phases.

## What Changes

- **Books (schema-ready)**: add a `books` domain and a `book_id` on customers and transactions. Every user gets a default book; the product stays single-book for now, but the schema no longer blocks multi-book later.
- **Payment recording**: capture a payment method (cash / UPI / other) on transactions and record full or partial payments that reduce a customer's outstanding balance; payment history is visible per customer and in the dashboard.
- **Offline write-queue (mobile)**: queue customer and transaction writes while offline, replay them when connectivity returns, and never double-create entries.
- **Shareable customer statements**: generate a per-customer statement (PDF/image) with period filter, totals, and running balance, shareable to WhatsApp through the OS share sheet (web: download/print).
- **Data portability**: one-tap CSV export of customers and transactions, a full account data download, and self-serve account deletion (a Play Store requirement for public apps with personal data).
- **UPI collection**: users save their UPI ID (VPA) and payee name; every outstanding balance can be turned into a UPI intent link or QR with the amount prefilled; a "who owes me" collection view sorts receivables by amount and age.
- **Dashboard v2**: 12-month credit/debit trend, top debtors, and aging buckets (0–30 / 30–60 / 60+ days).
- **App lock (mobile)**: PIN with optional biometric unlock, auto-lock on background, credentials stored in secure storage.
- **Onboarding**: first-run flow that guides the user to create a customer and first entry, offers optional sample data, and replaces bare empty states on web and mobile.
- **Audit coverage**: account deletion and account data export are recorded in the audit trail.

No breaking changes: all additions are additive and existing clients keep working.

## Capabilities

### New Capabilities

- `ledger-books`: per-user book ownership, default book creation, and book scoping of customers and transactions.
- `payment-recording`: payment method capture and full/partial payment recording against customer balances.
- `offline-write-queue`: mobile offline capture and safe replay with idempotency.
- `customer-statements`: per-customer shareable statements with period filtering and running balance.
- `data-portability`: CSV export, full account data download, and self-serve account deletion.
- `upi-collection`: UPI ID configuration, UPI intent links and QR codes, and the receivables collection view.
- `dashboard-analytics`: receivables trend, top debtors, and aging buckets.
- `app-lock`: mobile app lock with PIN, optional biometrics, and auto-lock.
- `onboarding`: first-run guidance, optional sample data, and empty states.

### Modified Capabilities

- `audit-logging`: account lifecycle events (data export and account deletion) become auditable.

## Impact

- **API** (`apps/api`): new Drizzle tables (`books`, `user_settings`) and columns (`customers.book_id`, `transactions.book_id`, `transactions.payment_method`), a data migration to backfill default books, new route groups (`/books`, `/statements`, `/exports`, `/account`, `/collection`, `/dashboard` analytics additions), validator and audit changes, and contract tests for every new route.
- **Mobile** (`apps/app`): offline queue and network-state handling, statement share flow, payment-method entry, app-lock gate, onboarding screens. New dependencies: `expo-print`, `expo-sharing`, `expo-local-authentication`, `react-native-qrcode-svg`, and an image/QR capture helper.
- **Web** (`apps/web`): payment-method entry, dashboard charts (`recharts` is already installed), collection view, export and account-settings pages, statement print/download view, onboarding and empty states.
- **Docs**: update README deployment/setup notes where new env-independent behavior (exports, statements) is user-facing; no new required secrets.
- **Data**: additive migration only; existing rows are backfilled to each user's default book, and historical transactions keep `payment_method = null` (displayed as unspecified).
