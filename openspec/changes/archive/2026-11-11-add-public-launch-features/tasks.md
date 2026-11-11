# Tasks

## 1. Schema foundation and migrations

- [x] 1.1 Add the `books` and `user_settings` tables, the `payment_method` enum, and `book_id`, `payment_method`, `is_sample` columns to `apps/api/src/db/schema.ts`; verify `cd apps/api && bun run db:generate` emits a migration and `bun run typecheck` passes.
- [x] 1.2 Write the expansion and backfill migration (default book per existing user, backfill `book_id`, then enforce `NOT NULL`); verify it applies on a local database and `SELECT count(*) FROM customers WHERE book_id IS NULL` and the equivalent transactions count both return 0.
- [x] 1.3 Add indexes and constraints: partial unique index for one default book per user, `(customer_id, created_at)` for transaction reads, and an index supporting `is_sample` filtering; verify the migration applies and the generated SQL matches the design.
- [x] 1.4 Update `apps/api/src/test` fixtures/types for the new columns and tables; verify the existing contract suite still passes with `bun run test`.

## 2. Books capability

- [x] 2.1 Implement `GET /books` that returns the user's default book and lazily creates it idempotently; add contract tests proving a new user gets exactly one default book and repeated calls create no duplicates.
- [x] 2.2 Resolve `book_id` server-side on customer and transaction writes and derive a transaction's book from its customer; add contract tests proving cross-user book references return `404` and no data changes.
- [x] 2.3 Include `bookId` in customer and transaction responses; verify the updated contract tests and `bun run typecheck` pass.
- [x] 2.4 Document the single-book behavior and `GET /books` contract in the repo docs; verify the documented request/response examples by running them against the local API.

## 3. Payment recording

- [x] 3.1 Extend transaction create/update validators with the `paymentMethod` enum and persist it; add API tests for valid persistence, `400` on invalid values, and readable `null` on legacy rows.
- [x] 3.2 Confirm ledger and customer-detail responses surface the payment method and that totals/running balances are unchanged; verify all contract tests pass and a partial payment produces the expected balance.
- [x] 3.3 Add the payment-method selector to web transaction entry and edit dialogs; verify by recording an entry and reloading it with the same method.
- [x] 3.4 Add the payment-method selector to the mobile ledger entry and quick-entry flows; verify on a simulator/device that the method persists after reload.
- [x] 3.5 Render payment method in web and mobile transaction history with a distinct payment presentation; verify a payment row is visually distinguishable from a credit row.

## 4. Data portability

- [x] 4.1 Implement streaming CSV exports for customers and transactions with correct escaping, ISO-8601 timestamps, two-decimal amounts, and `401` for unauthenticated clients; add unit tests for quoting/formatting and a contract test for the unauthenticated case.
- [x] 4.2 Implement the JSON account archive including soft-deleted rows flagged as deleted and excluding other users' data; add contract tests for completeness and isolation.
- [x] 4.3 Implement `DELETE /account` with the explicit confirmation body, audit entry written before the hard delete, and cascade removal of identity, sessions, customers, and transactions; add contract tests for confirmation refusal, sign-in prevention after deletion, and other users being unaffected.
- [x] 4.4 Emit audit entries for account export, successful deletion, and failed deletion; add tests asserting retained audit rows and pseudonymous actor data.
- [x] 4.5 Build the web account settings surface for exports and account deletion with a confirmation flow; verify downloads succeed and deletion removes access against the local API.
- [ ] 4.6 Build the mobile account settings surface for exports and deletion; verify each action completes on a simulator/device.
- [x] 4.7 Document the export, archive, and deletion endpoints in `docs/`; verify the documented examples against the local API.

## 5. Customer statements

- [x] 5.1 Implement the statement model endpoint with period filtering, opening balance, running balance, totals, soft-delete exclusion, and ownership scoping; add tests for full history, partial range, deleted entries, and cross-user `404`.
- [x] 5.2 Build the web statement view with a print stylesheet and verify downloading/printing produces a PDF containing the same entries and totals shown on screen.
- [ ] 5.3 Build the mobile statement flow using `expo-print` and `expo-sharing` (plus an image variant) and verify the OS share sheet opens with a correctly named PDF.
- [x] 5.4 Document statement periods, file naming, and sharing behavior; verify the documented flow on both platforms.

## 6. Offline write queue

- [x] 6.1 Accept optional client-supplied UUIDs on customer and transaction creation with idempotent conflict handling scoped to the owner; add contract tests proving retries return the existing record and cross-user conflicts return `404`.
- [x] 6.2 Implement the mobile SQLite queue module (enqueue, FIFO processing, retry, failed state, sync marking) with unit tests covering ordering, deduplication, and restart persistence.
- [x] 6.3 Route mobile customer and transaction submissions through the queue with a pending indicator; verify an airplane-mode entry appears pending and survives an app restart.
- [x] 6.4 Implement replay triggers on connectivity change and app foreground plus the failed-item review/retry/discard UI; verify reconnect syncs exactly once, and a server-rejected item is visible rather than dropped.
- [x] 6.5 Label cached reads as stale while offline and refresh after reconnect; verify the label appears offline and disappears after sync.
- [x] 6.6 Document offline behavior and queue semantics; verify the documented steps reproduce the pending/synced/failed states.

## 7. UPI collection

- [x] 7.1 Implement the `user_settings` read/update endpoints for UPI ID and payee name with VPA validation; add tests for valid save, `400` on invalid VPA, and cross-user isolation.
- [x] 7.2 Implement the UPI intent builder and QR payload generator with two-decimal amount and note encoding; add unit tests proving the URI fields and QR payload match.
- [x] 7.3 Implement the FIFO aging helper and `GET /collection` returning positive balances, outstanding amount, oldest unpaid credit, and age in days with sorting; add tests for exclusion of zero/negative balances, ordering, and bucket boundaries.
- [x] 7.4 Build the web collection view with UPI link copy and QR display; verify a generated link contains the configured VPA and outstanding amount.
- [ ] 7.5 Build the mobile collection view with QR and share; verify the generated QR scans to the same UPI intent.
- [x] 7.6 Document UPI configuration and collection behavior, including that payment completion is recorded manually; verify the documented flow.

## 8. Dashboard analytics

- [x] 8.1 Implement `GET /dashboard/analytics` with a 12-month zero-filled series, top debtors, and aging buckets reusing the FIFO helper; add tests for the twelve points, ordering, and bucket sums.
- [x] 8.2 Build the web dashboard trend chart, top-debtors list, and aging cards; verify they render with seeded data and show empty states without data.
- [x] 8.3 Build the mobile dashboard trend, debtor, and aging summaries; verify they match the web values for the same account.
- [x] 8.4 Document the analytics endpoint and its UTC month boundary; verify the documented response example matches the local API.

## 9. App lock

- [x] 9.1 Add the mobile dependencies (`expo-local-authentication`, `expo-crypto`, `expo-screen-capture`) and verify the app builds and `bun run typecheck`/`lint` pass in `apps/app`.
- [x] 9.2 Implement PIN setup, verification, and disable requiring the current PIN, storing only a salted hash in SecureStore; add unit tests for hash/verify and wrong-PIN rejection.
- [ ] 9.3 Add the lock gate with biometric fallback and the configurable auto-lock timer (default 60 seconds); verify cold start locks and backgrounding past the timeout re-locks.
- [ ] 9.4 Mask the app-switcher snapshot and enforce the five-attempt cooldown; verify the preview hides financial data and repeated failures introduce a delay.
- [x] 9.5 Document app-lock behavior and recovery; verify the documented steps on a device.

## 10. Onboarding and sample data

- [x] 10.1 Implement sample-data seeding and removal using `is_sample`; add tests proving sample rows are labeled, removal deletes only them, and real customers/transactions/totals are unchanged.
- [x] 10.2 Persist onboarding completion/dismissal in `user_settings` and build the web first-run flow; verify skip and completion both prevent the flow from reappearing.
- [ ] 10.3 Build the mobile first-run flow with the same persistence; verify skip and completion behavior on a device.
- [x] 10.4 Add actionable empty states for customers, ledger, dashboard, and collection on web and mobile; verify each empty screen explains itself and offers its primary action.
- [x] 10.5 Verify exports exclude sample rows while sample data is loaded and after removal; add or extend tests to cover the exclusion.
- [x] 10.6 Document onboarding and sample-data behavior; verify the documented steps.

## 11. Integration verification

- [x] 11.1 Run `bun run typecheck`, `bun run lint`, and `bun run test` from the repository root and verify all pass.
- [ ] 11.2 Run end-to-end smoke tests on web and mobile covering sign-in, customer creation, payment with method, offline entry sync, statement share, UPI link/QR, collection view, dashboard analytics, export, and account deletion on a disposable account.
- [x] 11.3 Update the README and docs index for the new user-facing features and verify every new link resolves.

## Workflow follow-up

- Archive the change after the project's review requirements are satisfied.
- Verify the archived specs contain all nine new capabilities and the updated `audit-logging` requirement.
