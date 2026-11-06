# Design

## Context

See proposal.md (Why). Current state observed in code:

- Web detail view `apps/web/app/(app)/customers/detail/CustomerDetailView.tsx` fetches `useCustomerTransactions(customerId, { page, pageSize })` (pageSize 10) and computes `totalCredit`/`totalDebit`/`balance` by reducing `txns.data` (lines 65–77) — the current page only. Running balances (lines 80–90) restart at 0 per page. Search/type filter (lines 93–100) is client-side over the page slice.
- Backend `GET /transactions/customers/:id/transactions` (`apps/api/src/routes/transactions.ts:54-118`) already computes `total` (count) and `totalAmount` (net `SUM(amount)`) over the full filtered set, but no per-type credit/debit split. The web `PagedTransactions` type (`apps/web/lib/api.ts:132-137`) does not even expose `totalAmount`.
- Mobile app (`apps/app/app/customers/details.tsx`) uses Supabase RPC `get_contact_balance` over all rows — unaffected, out of scope.

## Goals / Non-Goals

**Goals:**
- Totals on the web customer detail page always describe the whole customer (same filter set), independent of `page`/`pageSize`.
- Row-level "Balance after" correct on every page without fetching all rows.
- Additive, backwards-compatible API change.

**Non-Goals:**
- Server-side text search / type filter (client filter stays as-is; documented).
- Changing pagination defaults, date-filter semantics, or the mobile app.
- Backfilling a stored balance column.

## Decisions

1. **Add `totalCredit`/`totalDebit` to the list endpoint** (not a separate `/summary` call) — one round trip, same filter predicate, no extra endpoint to secure/paginate. Alternative (separate summary endpoint) rejected: doubles requests and risks filter drift between the two calls. The existing `totalAmount` net-sum query is extended into a conditional-sum query:
   `SUM(CASE WHEN type='credit' THEN amount ELSE 0 END)` / same for debit, over the identical `filters` array, no `LIMIT`/`OFFSET`. `COALESCE(...,0)` keeps the zero-transaction case at 0.
2. **Keep `totalAmount` in the response** — it is already returned; removing it would be a breaking change for unknown consumers. Frontend may ignore it (net = credit − debit).
3. **Frontend uses server aggregates for cards + profile header** — `CustomerDetailView` reads `txns.totalCredit`/`txns.totalDebit`, derives `balance = totalCredit − totalDebit`, passes to `CustomerAnalyticsCards` and `CustomerProfileHeader`. Page-slice reduction is deleted. Alternative (fetch all pages client-side to sum) rejected: O(n) transfer on every view, breaks with large histories.
4. **Running balances: offset-aware anchor.** Two candidate implementations; implementer picks during apply, both satisfy the spec:
   - (a) Server returns per-row `runningBalance` computed with a window function over the customer's full ordered history (`SUM(...) OVER (ORDER BY createdAt, id)`), paginated after. Most correct (stable under concurrent inserts, exact with ties) at the cost of a window query.
   - (b) Client anchors from server totals: `balanceAfter(newest on page p) = netTotal − (sum of all newer pages)`. Requires fetching newer-page sums or reversing computation from the grand total; fragile with date-filtered subsets.
   Preferred: (a) server-side window column. Fallback (b) only if the window query proves problematic on Neon.
   Ordering tiebreak (`createdAt`, `id`) must match the list `ORDER BY` so balances align with displayed order.
5. **Filter semantics documented, not expanded** — search box and All/Credit/Debit dropdown remain client-side per-page filters; totals describe the server filter set (date range). A follow-up change can promote them to query params (`q`, `type`) reusing the same aggregate path.

## Risks / Trade-offs

- [Risk] Conditional-sum adds one aggregate scan per list request → Mitigation: same indexed predicate (`customerId`, `userId`, `deletedAt`), single extra lightweight aggregate; can be merged into the existing `Promise.all` block.
- [Risk] Window-function running balances change row payload shape → Mitigation: additive optional field (`runningBalance`), old clients ignore it.
- [Risk] `amount` stored as integer paise vs float → Mitigation: sums use the column's native type, no client rounding; verify `COALESCE` type matches existing `totalAmount` handling.
- [Risk] Date-filter boundary (`start`/`end` inclusive `lte`) must apply identically to page query and aggregates → Mitigation: build one `filters` array, reuse for all three queries (page, count, sums).

## Migration Plan

- Deploy API first (additive fields; old web ignores them), then web. No DB migration. Rollback: revert web to page-slice math (bug returns, nothing breaks); revert API independently — web must null-guard missing fields (`?? 0`).
