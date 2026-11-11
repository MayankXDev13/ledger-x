# Web — Customers (`/customers`, `/customers/detail`, `/customers/statement`)

> Overrides `design-system/ledger-x/MASTER.md` for
> `apps/web/app/(app)/customers/**` and `apps/web/components/customers/**`.

## 1. List page

- Search field: visible label or `aria-label` (`components/customers/CustomerSearch.tsx`).
- Result count: ≥ 12px, `text-muted-foreground`.
- Grid: 1 column on mobile, 2 on `sm`, 3 on `lg`. Each card shows name (1 line, truncated),
  phone (12px muted) and the outstanding amount (`tabular-nums`).
- **One primary action on mobile.** Today the header "Add Customer"
  (`customers/page.tsx:26-33`) and the fixed FAB (`:79-91`) are both visible below `lg`. Keep the
  FAB, drop the header button on mobile, and give the FAB `padding-bottom:
  env(safe-area-inset-bottom)` so it clears the iOS home indicator.
- Empty state: "No customers yet" + Add customer (it exists and is good) — but it must not be
  shown when the **request failed**. `customers/page.tsx:24-29` maps an error to `[]`, which
  renders the empty state on a 500. Branch on `isError` and show an error + retry.
- `useCustomers` should invalidate the customer detail and dashboard queries after a delete
  (`hooks/useCustomers.ts:56-67`), and the detail page should navigate away when the customer
  it is showing no longer exists.

## 2. Customer card

- Row actions must be **visible without hover**: add `focus-visible:opacity-100` and
  `group-focus-within:opacity-100`, or render the actions permanently on touch viewports.
  `components/customers/CustomerCard.tsx:67` currently uses `opacity-0 group-hover:opacity-100`.
- Do not nest `<button>` inside `<Link>` (`CustomerCard.tsx:39,68-93`). Move the actions outside
  the anchor or use a dropdown menu.
- Target size ≥ 44px on mobile web; `size="icon"` buttons are 32–36px today.
- The "⋯" overflow menu (`CustomerProfileHeader.tsx:226-232`) needs an `aria-label`.

## 3. Customer detail

- Hero: outstanding balance, 24–32px, `tabular-nums`, neutral `ink`. Turn it `danger-text` only
  when the oldest unpaid credit is 60+ days (matching the mobile rule).
- The 5 action buttons in one row must wrap on narrow screens or move to a menu.
- Transaction filter select needs an accessible name (`CustomerDetailView.tsx:167-179`).
- Transaction search needs a label (`CustomerDetailView.tsx:157-163`).
- **Pagination truth:** the badge shows `txns.total` while the table shows the current page
  filtered by the search string (`CustomerDetailView.tsx:78-85,146-150,211-219`). Either filter
  server-side or label the counts honestly ("2 of 40 match on this page").
- "Customer since" must show the real creation date, not `new Date()`
  (`CustomerProfileHeader.tsx:162`).
- The Receivable / Payable / Settled pill relies on `.chip-receivable` / `.chip-payable` /
  `.chip-settled`, which **do not exist** — the pill renders as bare text. Define the three
  utilities or replace them with the `Badge` primitive.

## 4. Statement (`/customers/statement`)

- Print layout is already good (`globals.css:171-224`) — keep it.
- On screen the 5-column table is clipped: `StatementView.tsx:232` uses `overflow-hidden` with no
  `overflow-x-auto`. Add horizontal scrolling, or switch to a stacked card list under `sm`.
- Amounts: `tabular-nums`, and **signed** — the current statement shows unsigned amounts and
  relies on the column heading plus colour (WCAG 1.4.1 risk).
- `<th>` elements need `scope="col"` (`StatementView.tsx:236-245`).
- The period filter is not a `<form>` and Enter does nothing (`StatementView.tsx:104-150`); it
  should also reject `start > end` with an inline message instead of silently showing
  "No transactions in this period."

## 5. Dialogs

- Use `DialogDescription`, not a bare `<p>` (`CustomerDialog.tsx:71-75`,
  `TransactionDialog.tsx:151-155`).
- The submit button must stay enabled and validation must run on blur so field errors can be
  displayed (`CustomerDialog.tsx:36-39,135`; `TransactionDialog.tsx:65,292`).
- `handleSubmit` needs a `try/catch` and an inline error (`CustomerDialog.tsx:41-48`).
- Clearing the amount field must not surface "Expected number, received nan"
  (`TransactionDialog.tsx:209`; `lib/validation.ts:12`).
