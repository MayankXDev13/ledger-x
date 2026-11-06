# Proposal

## Why

The customer detail page (`/customers/detail`) computes Total Credit, Total Debit, Net Balance, and per-row "Balance after" from only the transactions on the currently visible page (`txns.data`, 10 rows). A customer with 18 transactions therefore shows wrong totals on both pages — e.g. page 1 of 2 reports partial sums instead of the whole-customer aggregates. Summary stats must reflect all of the customer's transactions, not the paginated slice.

## What Changes

- Backend `GET /transactions/customers/:id/transactions` returns whole-customer aggregates alongside the paginated page: split `totalCredit` and `totalDebit` sums (in addition to the existing `total` count), computed over the same filters but without `LIMIT`/`OFFSET`.
- The web `PagedTransactions` type exposes the new summary fields, and the customer detail view uses them for the Total Credit / Total Debit / Net Balance cards and the profile-header balance instead of summing the current page.
- Running "Balance after" per row is computed against the true cumulative balance (page-aware), so rows on page 2+ show correct post-transaction balances.
- Search/type filter behavior is defined: text search stays client-side per page (documented), while totals always describe the full filtered set returned by the server.

## Capabilities

### New Capabilities
- `customer-transaction-summary`: server-computed, whole-customer credit/debit aggregates and page-aware running balances on the customer detail view, independent of transaction-list pagination.

### Modified Capabilities
- None (no existing spec covers transaction listing aggregates; `web-api-integration` query-validation requirement is unchanged — new fields are additive and backwards-compatible).

## Impact

- Affected code: `apps/api/src/routes/transactions.ts` (aggregate queries), `apps/api/src/validators.ts` (if filter params change), `apps/web/lib/api.ts` (`PagedTransactions` type), `apps/web/app/(app)/customers/detail/CustomerDetailView.tsx` (analytics + running balances), `apps/web/components/transactions/TransactionItem.tsx` display (unchanged contract).
- API: additive response fields (`totalCredit`, `totalDebit`); existing `total`, `data`, `page`, `pageSize` unchanged.
- No breaking changes; mobile app (`apps/app`) uses Supabase RPC `get_contact_balance` and is out of scope.
