# Design

## Context

See `proposal.md` for motivation. Current state that shapes this design:

- `apps/api` is Hono on Cloudflare Workers with Drizzle + Postgres (Hyperdrive). Balance is never stored: it is `SUM(credit) − SUM(debit)` over non-deleted transactions, and the customer detail endpoint computes per-row running balances with a SQL window function (`apps/api/src/routes/transactions.ts`). Whole-customer aggregates are server-computed (`customer-transaction-summary`).
- Transactions store integer minor units (paise) via `amount`, `type` (`credit` | `debit`), `note`, and soft-delete `deletedAt`. Customers and transactions are UUID-keyed and user-scoped.
- All routes are Bearer-authenticated; errors use the JSON envelope from `web-api-integration`. Mutations on customers/transactions are audited (`audit-logging`); `audit_logs` has no foreign key on its actor column, so audit rows survive account removal.
- `apps/web` is Next.js App Router with TanStack Query, `recharts`, and shadcn UI. `apps/app` is Expo 54 with expo-router, AsyncStorage, `expo-sqlite`, `expo-network`, and `expo-secure-store`; `expo-print`, `expo-sharing`, `expo-local-authentication`, `expo-crypto`, `expo-screen-capture`, and a QR renderer are not yet installed.
- There is no shared package between the three apps; request/response contracts are hand-written clients per platform.

## Goals / Non-Goals

**Goals:**

- Extend the data model additively so no existing client contract breaks.
- Keep balances and aggregate rules in one place: the API computes money truth; clients render it.
- Make offline capture safe (no duplicates, no silent loss) without introducing a sync server or CRDTs.
- Keep the app as a pure recorder for UPI: no payment gateway, no money custody, no auto-reconciliation.
- Sequence the work so each phase ships independently on web and mobile.

**Non-Goals:**

- Multi-book management UI, book sharing, or book-level permissions (schema only).
- Invoice-level payment allocation, invoice numbering, or reconciliation against specific entries.
- Payment gateway integration, webhook callbacks, or automatic payment confirmation.
- Server-side headless PDF rendering.
- Automated WhatsApp/SMS reminders (decided out of scope in the interview).
- Offline reads beyond clearly labeled stale cache.

## Decisions

### Books: dedicated `books` table + nullable-then-backfilled `book_id`

Add a `books` table (`id uuid`, `user_id`, `name`, `is_default`, timestamps) and `book_id` on `customers` and `transactions`. A partial unique index on `(user_id) WHERE is_default` guarantees one default book per user. `GET /books` lazily creates the default book with `INSERT ... ON CONFLICT DO NOTHING`, so existing users get one without a separate onboarding step.

The migration is expand-contract: add nullable columns and tables, insert default books for all existing users, backfill `book_id`, then set `NOT NULL` on the columns. All write endpoints resolve `book_id` server-side from the user's default book; clients never send it, which eliminates a spoofing surface. Transaction creation derives `book_id` from the customer, keeping customer/transaction books consistent.

*Alternatives:* a `book_id` default only in code (no table) — rejected, would need a rename later; book-scoped routes (`/books/:id/customers`) — rejected as premature API churn.

### Payments: debit transaction + payment method enum, no allocation table

Payments are existing debit entries with a new nullable `payment_method` enum (`cash`, `upi`, `other`). Partial and over-payments fall out of the existing signed-sum model with zero extra logic: a debit reduces the balance, and a debit beyond it produces a negative balance interpreted as an advance. Editing and deleting payments inherit transaction behavior and audit coverage.

FIFO aging is computed on demand instead of persisted: for each customer, cumulative credits are compared with cumulative payments ordered by time, and the first credit not fully covered is the "oldest unpaid credit". This matches how shopkeepers read a running-balance khata and avoids an allocation table that would need rewriting whenever entries are edited or deleted.

*Alternatives:* a `payments`/`allocations` table with per-invoice settlement — rejected as high complexity for a running-balance ledger; a stored `balance` column — rejected because it would duplicate a derived value and drift.

### Offline queue: expo-sqlite queue + client-supplied UUIDs

The mobile app keeps an ordered queue in `expo-sqlite` (already installed). Each write gets a UUID generated on the device. The API accepts an optional client-supplied `id` on customer and transaction creation, validates it as a UUID, and treats a conflict on `(user_id, id)` as idempotent: return the existing owned record instead of inserting. A conflict with another user's id returns `404` and never exposes that record. A unique index on `(user_id, client_id)` is unnecessary because the primary key already carries the contract; the ownership check on conflict is the guard.

Queue processing is strictly FIFO so a customer is created before the transactions that reference its device-generated UUID. On success the local row is marked synced; on a permanent 4xx it becomes a visible failed item; on network/5xx it stays pending and retries automatically. `expo-network` drives connectivity transitions and replay triggers; replay also runs on app foreground. Reads keep using the normal API with TanStack Query/AsyncStorage cache and are explicitly labeled stale while offline.

*Alternatives:* AsyncStorage JSON queue — rejected for large queues and no transactional ordering; server-generated ids with a local mapping table — rejected as more moving parts than client UUIDs.

### Statements: API computes data, clients render and share

`GET /customers/:id/statement?start&end` returns the statement model (customer, period, entries, opening/closing balance, totals) computed with the same signed-sum and window logic as the transaction list, guaranteeing consistency. The range query also returns the balance immediately before `start` as the opening balance, so partial-range statements are correct.

Both clients render the model from a shared HTML template concept: web prints to PDF via the browser print dialog (satisfies downloadable/printable PDF), mobile renders HTML into PDF with `expo-print` and shares it through `expo-sharing`; a PNG variant is produced with a view-capture helper for chat previews. Filenames follow `<customer-slug>-statement-<YYYY-MM-DD>_<YYYY-MM-DD>.pdf`. Soft-deleted entries are excluded by the same filter as the transaction list.

*Alternatives:* server-side PDF generation on Workers — rejected (no headless browser; external render service adds cost and a data-processor); client-side jsPDF — rejected in favor of the OS print pipeline and `expo-print`.

### UPI: client-generated intent URI, server stores configuration only

A `user_settings` table (one row per user) stores `upi_id` (VPA), `payee_name`, and onboarding state. VPA validation is a `handle@provider` regex enforced by Zod. The UPI intent URI is assembled on-device from configuration plus the displayed outstanding amount: `upi://pay?pa=<vpa>&pn=<payee>&am=<amount 2dp>&cu=INR&tn=<note>`. The QR encodes the same URI. Because the link points at the user's own VPA, money never passes through Ledger-X and no payment-aggregator compliance applies.

The collection view is a server aggregate: `GET /collection` returns customers with a positive balance plus outstanding amount, oldest-unpaid-credit date, and age in days, computed FIFO per the payment decision. Sorting happens client-side over the returned set (small per-user cardinality) or via a `sort` query parameter. Completing a UPI payment never creates an entry; the user still records it, and the app may prefill the payment form from the request amount as a convenience.

*Alternatives:* storing UPI ID on the Better Auth `user` table — rejected because that table is CLI-generated and must not be hand-edited; server-generated payment links persisted as records — rejected as unnecessary until reminders/payment tracking exists.

### Dashboard analytics: one analytics endpoint, SQL aggregates

`GET /dashboard/analytics` returns three blocks: 12 monthly credit/debit totals (generated series so empty months appear as zero), top debtors by positive balance, and aging bucket totals. All queries are user-scoped and exclude soft-deleted rows. Month boundaries use UTC calendar months for determinism; the UI labels months by name and does not promise local-midnight boundaries.

*Alternatives:* separate endpoints per block — rejected, triples round trips for one screen; client-side aggregation from paginated lists — rejected, incorrect at scale and duplicates money truth.

### App lock: device-local, SecureStore + expo-crypto

App lock is entirely device-local and never synced: a salted SHA-256 of the PIN (via `expo-crypto`) is stored in `expo-secure-store`, never plaintext. Biometrics use `expo-local-authentication` with PIN fallback. Auto-lock is driven by `AppState` background timing (default 60 s, configurable). An opaque overlay plus `expo-screen-capture` masks the app-switcher snapshot. Failed attempts increment a counter persisted in SecureStore; from the fifth consecutive failure, an exponentially increasing cooldown is enforced locally.

*Alternatives:* server-synced PIN — rejected, adds a credential attack surface and breaks offline use for no benefit; storing the PIN hash in AsyncStorage — rejected, not secure storage.

### Data portability: streaming CSV, JSON account archive, hard delete with audit retention

CSV endpoints stream rows (header first) with a small escaping helper, UTF-8, ISO-8601 timestamps, and amounts formatted as `0.00` in major units. Exports exclude soft-deleted and sample rows. The account archive is a single JSON document containing all owned customers and transactions, including soft-deleted rows flagged `deleted`, downloaded as `ledger-x-account-export.json`. A zip archive was rejected because Workers have no built-in zip and adding a zip library is not worth it for a file users open rarely.

Account deletion is a `DELETE /account` guarded by a confirmation body (`{ "confirm": "DELETE" }`). The handler writes the audit entry first (actor id, outcome), then hard-deletes the Better Auth user row; `session`, `account`, `customers`, and `transactions` cascade, and `audit_logs` survives because it has no FK. The deletion entry retains only the pseudonymous actor id, satisfying append-only audit retention without keeping PII.

*Alternatives:* soft-deleting the account only — rejected, the spec promises identity removal and re-sign-in prevention; anonymizing rows in place — rejected as more complex than cascade for equal privacy.

### Sample data: `is_sample` flag on rows

Sample customers and transactions are real rows flagged `is_sample` so they render, aggregate, and delete exactly like normal data. `POST /sample-data` seeds them; `DELETE /sample-data` removes only flagged rows. Exports exclude them. Aggregates include them while present so the numbers the user sees always match the entries they see; removal returns totals to real values. This is documented as an intentional trade-off.

*Alternative:* a separate demo mode with client-only fixtures — rejected because it would not exercise the real API and could drift.

## Risks / Trade-offs

- **FIFO aging recomputation** → every collection/analytics read aggregates the user's full transaction history. Mitigate with `(user_id, deleted_at)` and `(customer_id, created_at)` indexes; per-user data volumes are small. If a heavy user appears, add a cached materialized per-customer balance later without changing the API.
- **Client-supplied UUIDs** → a malicious client could probe another user's id. Mitigate by scoping the conflict lookup to the authenticated user and returning `404` on any non-owned match, identical to other cross-user behavior.
- **Clock/order ties in running balances** → entries created offline may arrive with server timestamps close together; keep the existing `(created_at, id)` tiebreak so ordering is deterministic, and never derive balance order from client clocks.
- **Web PDF via print dialog** → browser print headers/footers and margins vary. Mitigate with a dedicated `@media print` stylesheet and a manual verification task; fall back to a client PDF library only if the output is unusable.
- **Account deletion vs. audit retention** → the actor id is pseudonymous but retained forever. Document this in the deletion confirmation and privacy copy; no other PII is kept.
- **Sample data in totals** → totals include sample rows until removal. Mitigate by labeling them clearly in every list and doing removal in one confirmed action.
- **UTC month boundaries** → users near midnight in non-UTC timezones may see an entry in the neighboring month. Document the boundary; adding a per-user timezone is a later change.
- **Offline replay ordering** → a transaction whose customer was created offline depends on queue order. Mitigate by rejecting/reordering dependencies explicitly instead of relying on timestamps.

## Migration Plan

1. Generate Drizzle migrations for `books`, `user_settings`, and the new nullable columns (`book_id`, `payment_method`, `is_sample`).
2. Run the expansion migration: create tables, add nullable columns.
3. Run the backfill migration: insert default books for existing users, set `book_id` from the owner's default book, then enforce `NOT NULL`.
4. Deploy the API with book resolution and idempotent-create behavior; deploy web and mobile in the same release train (the project ships both in lockstep).
5. Rollback for the additive columns/tables is dropping them; payment methods and books are safe to remove because no client contract depends on them until the UI ships. Account deletion and export endpoints are additive.

## Open Questions

- Statement visual branding (logo/colors) can be decided during implementation without affecting specs or data contracts.
- When multi-book UI arrives, whether books get names/colors and whether sample data is book-scoped can be decided then; the schema already supports it.
