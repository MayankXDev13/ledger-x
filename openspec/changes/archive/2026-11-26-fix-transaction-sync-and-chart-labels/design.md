# Design

## Context

See `proposal.md` for motivation and observed symptoms.

The backend (`apps/api`) writes transactions synchronously to Postgres via Drizzle + Hyperdrive (with Hyperdrive query caching disabled) and returns the committed row on `201`. However, authenticated `GET` routes omit `Cache-Control: no-store`.

On the web client (`apps/web`), `useCreateTransaction` / `useUpdateTransaction` / `useDeleteTransaction` patch `byCustomerInfinite`, `customerKeys.balances()`, and `dashboardKeys.recentTransactions()`, but leave `dashboardKeys.metrics()`, `dashboardKeys.analytics()`, and non-infinite `transactionKeys.byCustomer(...)` unpatched. Because `invalidateQueries` defaults to `refetchType: "active"`, inactive dashboard queries remain stale until the user navigates back to `/dashboard`.

On the mobile client (`apps/app`), transaction creation routes through `OfflineQueueProvider` (`useOfflineQueue.tsx`), which has no optimistic TanStack Query cache updates; `CustomerDetailsScreen` and `CustomersScreen` ignore `queuedEntries` when computing balances; `useUpdateTransaction` and `useDeleteTransaction` have no optimistic patches; and `createReplayGuard()` in `queue-core.ts` drops concurrent `sync()` calls by returning `null` when `running === true`.

On the web dashboard (`apps/web/app/(app)/dashboard/page.tsx`), `Transaction Flow` and `By Type` share `chartData` keyed by `format(createdAt, "MMM d")`, `By Type` and `12-Month Trend` pass `labelKey="activities"` to `ChartTooltipContent` (forcing a static tooltip header), `By Type` colors bars by `entry.tone === "paid"` (misclassifying debits with `paymentMethod: null` as Credit), and `formatCompactCurrency` uses `Math.abs(value)` (dropping negative signs on Y-axis ticks).

## Goals / Non-Goals

**Goals:**
- Make transaction create/update/delete reflect immediately across customer detail, customer list, and dashboard views on both web and mobile.
- Prevent browser/proxy caching on authenticated ledger `GET` routes via `Cache-Control: no-store`.
- Ensure mobile offline-queue replays never drop concurrent sync triggers.
- Fix tooltip headers, same-day X-axis disambiguation, debit vs credit bar styling, and signed Y-axis formatting on the web dashboard charts.

**Non-Goals:**
- Introducing WebSockets, Server-Sent Events, or real-time push sync across devices (the 10s polling fallback stays as-is).
- Changing the database schema, REST API request/response shapes, or offline SQLite schema.
- Redesigning the dashboard layout or adding new chart types.

## Decisions

### 1. Extend pure cache-patch helpers on Web and mirror them on Mobile
- **Decision**: Extend `apps/web/lib/transaction-cache.ts` with pure helpers `applyTransactionToDashboardMetrics`, `applyTransactionToDashboardAnalytics`, and `applyTransactionToPagedList`, and add an equivalent pure `apps/app/lib/transaction-cache.ts` for mobile.
- **Rationale**: Pure functions are fast, deterministic, easy to unit-test with `bun test`, and update inactive queries in-place so navigating to `/dashboard` immediately renders up-to-date numbers while background invalidation reconciles with the server.
- **Alternative considered**: Setting `refetchType: "all"` on every `invalidateQueries` call. Rejected as the sole fix because it fires unnecessary background network requests for unmounted views and still lags behind network latency; optimistic cache patching gives instant UX while keeping `invalidateQueries` for authoritative reconciliation.

### 2. Fold `queuedEntries` into mobile customer balances + coalesce `createReplayGuard`
- **Decision**:
  - Update `createReplayGuard()` in `apps/app/lib/queue-core.ts` so if `run()` is called while `running === true`, it sets a `rerun` flag and returns a promise awaiting the follow-up pass (or loops while `rerun` is true inside the active run) so no enqueued item is skipped.
  - In `apps/app/app/customers/details.tsx` and `apps/app/app/(tabs)/customers.tsx`, compute customer balances by adding `pending` / not-yet-in-server `queuedEntries` deltas to the server-reported totals (matching `apps/app/app/(tabs)/home.tsx`).
  - In `useOfflineQueue.tsx`, optimistically patch the TanStack Query cache when a transaction is enqueued/synced, and keep `invalidateQueries` on sync completion.
- **Rationale**: Covers both online (instant UI before refetch finishes, no dropped concurrent syncs) and offline (accurate local balance while queued).

### 3. Add `Cache-Control: no-store` middleware on authenticated API `GET` routes
- **Decision**: Add a lightweight Hono middleware in `apps/api/src/app.ts` for authenticated ledger routes (`/transactions/*`, `/customers/*`, `/dashboard/*`, `/collection/*`, `/statements/*`) that sets `Cache-Control: no-store` on `GET` responses.
- **Rationale**: Guarantees that browser or intermediary HTTP caches never serve a stale `GET` response immediately after a `POST`/`PUT`/`DELETE`.

### 4. Fix Dashboard Chart Data, Tooltips, Styling, and Signed Axis Formatter
- **Decision**:
  - Extract a pure `buildRecentChartData(recentTxns, customers)` helper (testable with `bun test`) that gives each entry a unique X-axis key/label (e.g., `"MMM d"` when dates are unique, or `"MMM d, h:mm a"` / indexed suffix when multiple entries share a day) plus `customerName` and `fullLabel` for tooltips.
  - Remove `labelKey="activities"` from `By Type` and `12-Month Trend` `ChartTooltipContent` so Recharts passes the actual entry/month label to the tooltip header.
  - Style `By Type` bars by `entry.type === "debit"` → `var(--chart-1)` (Payment received) vs `"credit"` → `url(#hatchTypeCredit)` (Credit given), independent of whether optional `paymentMethod` is set.
  - Add `formatSignedCompactCurrency(value)` (or preserve sign in Y-axis tick formatter: `value < 0 ? "−" : ""`) so negative ticks below zero clearly show `−₹500`, `−₹1k`, etc.

## Risks / Trade-offs

- **[Risk] Optimistic analytics patch slightly differs from server FIFO aging buckets** → Mitigation: Patch `totalReceivables`, current-month `trend`, and `topDebtors` optimistically, and keep `invalidateQueries({ queryKey: dashboardKeys.all })` to reconcile exact FIFO aging buckets from the server.
- **[Risk] Coalesced `createReplayGuard` loop if a transient error keeps items pending** → Mitigation: Only loop when a *new* caller requested a rerun during the active pass (clear `rerun = false` before running the follow-up pass), never looping on transient failure alone.
- **[Risk] Double-counting queued entries on mobile when a server refetch lands** → Mitigation: Deduplicate by transaction `id` using `entriesNotIn(queuedEntries, serverIds)` (already used for the list) and only add deltas for entries not yet reflected in `latestPage` / `pending === true`.
