# Tasks

## 1. API — whole-customer aggregates

- [x] 1.1 Extend `GET /transactions/customers/:id/transactions` (`apps/api/src/routes/transactions.ts`) with `totalCredit`/`totalDebit` conditional sums over the shared `filters` array (no `LIMIT`/`OFFSET`, `COALESCE` to 0), and verify with a contract test covering a multi-page customer, a date-filtered request, and the zero-transaction case
- [x] 1.2 Add per-row running balance to the page payload (preferred: window `SUM(...) OVER (ORDER BY createdAt, id)` matching list order; document the chosen ordering tiebreak) and verify page-2 rows carry true cumulative balances

## 2. Web client — consume aggregates

- [x] 2.1 Extend `PagedTransactions` (`apps/web/lib/api.ts`) with `totalCredit`, `totalDebit` (and `totalAmount` if returned) plus optional per-row `runningBalance`, and verify `tsc --noEmit` passes for the web app
- [x] 2.2 Rewrite `CustomerDetailView` analytics (`apps/web/app/(app)/customers/detail/CustomerDetailView.tsx:65-77,131,145-151`) to use server aggregates for Total Credit / Total Debit / Net Balance and profile-header balance, removing the page-slice reduction, and verify totals stay identical when navigating page 1 → 2 for a customer with >10 transactions
- [x] 2.3 Render server-provided running balances in the transaction list (fallback `?? 0` null-guard for old API responses) and verify "Balance after" on page 2 matches the cumulative whole-customer balance

## 3. Integration verification

- [x] 3.1 Run `bun run test` from the repo root and the web typecheck, and verify all green with no regressions to pagination, date filters, or the error envelope
- [x] 3.2 Manually verify on the customer detail page with an 18-transaction customer: cards show full-history totals on both pages, entry count matches, and page-2 "Balance after" values are cumulative
