# Proposal

## Why

Recording a transaction from a customer page does not immediately reflect across all customer and dashboard views on both web and mobile: on web, dashboard metrics/analytics are not optimistically updated (and inactive queries are skipped by `invalidateQueries`), and API `GET` responses lack `Cache-Control: no-store`; on mobile, transaction mutations have no optimistic cache patching, customer balance cards ignore pending queued entries, and `createReplayGuard()` silently drops concurrent `sync()` calls. Separately, the web dashboard's **Transaction Flow** and **By Type** charts suffer from inaccurate labels and classification: `By Type` (and `12-Month Trend`) hardcodes `labelKey="activities"` so tooltips show one static header, same-day entries collide on identical X-axis date strings, debit payments without an optional `paymentMethod` are styled as Credit, and negative axis ticks lose their minus sign via `Math.abs`.

## What Changes

- **Instant cross-view transaction sync on Web (`apps/web`)**:
  - Extend `apps/web/lib/transaction-cache.ts` and `apps/web/hooks/useTransactions.ts` to optimistically patch `dashboardKeys.metrics()` (`totalBalance`, `monthlyNet`), `dashboardKeys.analytics()` (`totalReceivables`, current-month `trend`, `topDebtors`), and non-infinite `transactionKeys.byCustomer(...)` in addition to `byCustomerInfinite`, `customerKeys.balances()`, and `dashboardKeys.recentTransactions()`.
  - Trigger background invalidations without letting a stale/cached refetch overwrite fresh writes, and ensure `CustomerDetailView` reflects balance and transaction list updates immediately on create, update, and delete.
- **Instant cross-view transaction sync on Mobile (`apps/app`)**:
  - Fix `createReplayGuard()` in `apps/app/lib/queue-core.ts` so a `sync()` requested while a replay is already in flight runs a follow-up pass instead of silently returning `0` and skipping the newly enqueued transaction and cache invalidation.
  - Add optimistic TanStack Query cache patching (mirroring `apps/web/lib/transaction-cache.ts`) in `apps/app/hooks/useOfflineQueue.tsx` (on enqueue/sync) and `apps/app/hooks/useTransactions.ts` (on update/delete) for customer infinite transactions, customer balances, and dashboard metrics/recent/analytics.
  - Fold un-synced `queuedEntries` into the balance summary on `CustomerDetailsScreen` (`apps/app/app/customers/details.tsx`) and customer rows on `CustomersScreen` (`apps/app/app/(tabs)/customers.tsx`), matching `DashboardScreen`.
- **Defensive API no-store caching (`apps/api`)**:
  - Add `Cache-Control: no-store` on authenticated ledger `GET` routes (`transactions`, `customers`, `dashboard`, `collection`, `statements`) so browsers and intermediaries never serve stale `GET` responses after a write.
- **Accurate Dashboard Chart Labels & Classification (`apps/web`)**:
  - Fix `Transaction Flow` and `By Type` in `apps/web/app/(app)/dashboard/page.tsx`:
    - Remove the hardcoded `labelKey="activities"` from `By Type` and `12-Month Trend` tooltips so each tooltip header displays the entry's actual date/time/customer or month label.
    - Give each point/bar in `chartData` a distinct, informative label when multiple recent transactions occur on the same day (e.g., date + time or customer name in tooltip, disambiguated axis ticks).
    - Classify `By Type` bar colors and labels by `entry.type === "debit"` (Payment received) vs `"credit"` (Credit given) so debits recorded without an optional `paymentMethod` are never styled as Credit given.
    - Preserve negative signs on signed compact currency ticks (e.g., `−₹500`) in `Transaction Flow` and `By Type` Y-axes and tooltips.

## Capabilities

### New Capabilities
<!-- None — all changes refine existing specifications. -->

### Modified Capabilities
- `web-data-fetching`: Require immediate optimistic patching of dashboard metrics, analytics, recent transactions, customer balances, and customer transaction lists on transaction mutations, paired with `Cache-Control: no-store` on API reads so refetches never serve stale data.
- `mobile-data-fetching`: Require optimistic cache updates on transaction create/update/delete, inclusion of queued entries in customer detail and customer list balances, and coalesced follow-up replay in `createReplayGuard()` so concurrent sync requests are never dropped.
- `dashboard-analytics`: Require accurate per-entry/per-month tooltip headers, disambiguated same-day X-axis labels, signed Y-axis/tooltip formatting, and type-accurate credit vs payment styling on the web dashboard's `Transaction Flow`, `By Type`, and `12-Month Trend` charts.

## Impact

- **API (`apps/api`)**: `src/app.ts` (or route middleware for authenticated `GET` endpoints) to set `Cache-Control: no-store`, plus unit test coverage.
- **Web (`apps/web`)**: `lib/transaction-cache.ts`, `lib/transaction-cache.test.ts`, `hooks/useTransactions.ts`, `lib/format.ts`, `app/(app)/dashboard/page.tsx`, and unit tests for chart data/formatters.
- **Mobile (`apps/app`)**: `lib/queue-core.ts`, `lib/queue-core.test.ts`, `lib/queue-single-replay.test.ts`, new `lib/transaction-cache.ts` (+ test), `hooks/useOfflineQueue.tsx`, `hooks/useTransactions.ts`, `app/customers/details.tsx`, `app/(tabs)/customers.tsx`.
- **Dependencies**: No new dependencies.
