# Tasks

## 1. Backend HTTP Cache Prevention (`apps/api`)

- [x] 1.1 Add `Cache-Control: no-store` response header middleware for authenticated ledger `GET` routes (`/transactions/*`, `/customers/*`, `/dashboard/*`, `/collection/*`, `/statements/*`) in `apps/api/src/app.ts`, and add an API test asserting `Cache-Control: no-store` is returned on these `GET` endpoints; verify `bun run --cwd apps/api test` passes.

## 2. Web Instant Cross-View Transaction Cache (`apps/web`)

- [x] 2.1 Extend `apps/web/lib/transaction-cache.ts` with pure helpers to optimistically update `dashboardKeys.metrics()` (`totalBalance`, `monthlyNet`), `dashboardKeys.analytics()` (`totalReceivables`, current-month `trend`, `topDebtors`), and non-infinite `transactionKeys.byCustomer(...)` on transaction create/update/delete, and add unit tests in `apps/web/lib/transaction-cache.test.ts`; verify `bun run --cwd apps/web test` passes.
- [x] 2.2 Wire the new cache-patch helpers into `useCreateTransaction`, `useUpdateTransaction`, and `useDeleteTransaction` in `apps/web/hooks/useTransactions.ts` so customer detail, customer list, and dashboard views update immediately on mutation success while keeping background invalidation for reconciliation; verify `bun run --cwd apps/web typecheck` and `lint` pass.

## 3. Web Dashboard Chart Labels & Classification (`apps/web`)

- [x] 3.1 Add `formatSignedCompactCurrency` in `apps/web/lib/format.ts` (preserving `−` on negative values) and a pure `buildRecentChartData` helper (e.g., `apps/web/lib/dashboard-charts.ts`) that disambiguates same-day X-axis labels, attaches customer/date tooltip metadata, and classifies debit vs credit entries by `type` independent of optional `paymentMethod`, with unit tests; verify `bun run --cwd apps/web test` passes.
- [x] 3.2 Update `Transaction Flow`, `By Type`, and `12-Month Trend` in `apps/web/app/(app)/dashboard/page.tsx` to use `buildRecentChartData` and `formatSignedCompactCurrency`, remove hardcoded `labelKey="activities"` from `By Type` and `12-Month Trend` tooltips, and color/label `By Type` bars by `type === "debit"` vs `"credit"`; verify `bun run --cwd apps/web typecheck` and `lint` pass.

## 4. Mobile Instant Transaction Sync & Replay Coalescing (`apps/app`)

- [x] 4.1 Update `createReplayGuard()` in `apps/app/lib/queue-core.ts` so a `sync()` call arriving while a replay is in flight schedules and awaits a follow-up pass instead of dropping it, and update/add unit tests in `apps/app/lib/queue-core.test.ts` and `apps/app/lib/queue-single-replay.test.ts`; verify `bun run --cwd apps/app test` passes.
- [x] 4.2 Add pure optimistic cache helpers in `apps/app/lib/transaction-cache.ts` (mirroring web for infinite customer transactions, customer balances, and dashboard metrics/recent/analytics) with unit tests in `apps/app/lib/transaction-cache.test.ts`, and wire them into `apps/app/hooks/useOfflineQueue.tsx` (on transaction enqueue/sync) and `apps/app/hooks/useTransactions.ts` (on update/delete); verify `bun run --cwd apps/app test` and `typecheck` pass.
- [x] 4.3 Fold un-synced `queuedEntries` into customer balance calculations in `apps/app/app/customers/details.tsx` and `apps/app/app/(tabs)/customers.tsx` (deduplicated against server-confirmed entries so nothing is double-counted); verify `bun run --cwd apps/app typecheck` and `lint` pass.

## 5. Cross-App Verification

- [x] 5.1 Run full workspace validation (`bun run typecheck`, `bun run lint`, `bun run test`) across `apps/api`, `apps/web`, and `apps/app` and confirm all checks pass with zero regressions.
