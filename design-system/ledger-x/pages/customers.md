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

- **Legibility & line structure:** Customer name occupies a dedicated first line with at least 60% of row width and truncation threshold around 18 characters. Outstanding amount and aging (`oldestUnpaidLabel`) occupy a second line. Phone number is removed from the card and displayed on the detail screen instead.
- **Aging tone:** Driven by `balanceTone(balance.ageDays)`: neutral (< 60d), danger (≥ 60d).
- Row actions must be **visible without hover**: always visible on touch and keyboard with 44px touch targets (`size-11`).
- Do not nest `<button>` inside `<Link>`. Move the actions outside the anchor.

## 3. Customer detail

- **One primary action:** Exactly one visually primary CTA per viewport. The sticky bottom bar is the primary on small screens; desktop header owns the primary "Add Transaction". The in-card "+ Add" button is demoted to a named icon control (`size-11`) with `aria-label="Add transaction"`.
- **Hero & balance tone:** Current balance uses `balanceTone(ageDays)`: neutral below 60 days, `text-destructive` at 60+ days. Text explicitly states the direction ("▲ Receivable from customer", "▼ Payable to customer", "✓ All settled") so colour is never the sole indicator.
- **Statistics below `sm`:** Rendered as stacked hairline rows without icons so labels and amounts fit legibly on one line each without wrapping. Desktop renders the 4-card grid.
- Transaction filter select needs an accessible name (`CustomerDetailView.tsx`).
- Transaction search needs a label (`CustomerDetailView.tsx`).
- **Pagination truth:** the badge shows `txns.total` while the table shows the current page
  filtered by the search string. Either filter server-side or label the counts honestly.
- "Customer since" must show the real creation date, not `new Date()`.
- The Receivable / Payable / Settled pill uses the `Badge` primitive.

## 4. Statement (`/customers/statement`)

- **Filter layout:** Start date, End date, Apply and Clear share one `flex-wrap` row with consistent `gap-3` so Clear is never stranded on its own line.
- **Timestamp:** The generated timestamp uses `whitespace-nowrap` and full available width on narrow screens to prevent awkward mid-phrase wrapping.
- Print layout is already good (`globals.css`) — keep it.
- On screen the 5-column table is clipped: add horizontal scrolling.
- Amounts: `tabular-nums`, and **signed** with money presentation.
- `<th>` elements need `scope="col"`.

## 5. Dialogs

- Use `DialogDescription`, not a bare `<p>` (`CustomerDialog.tsx:71-75`,
  `TransactionDialog.tsx:151-155`).
- The submit button must stay enabled and validation must run on blur so field errors can be
  displayed (`CustomerDialog.tsx:36-39,135`; `TransactionDialog.tsx:65,292`).
- `handleSubmit` needs a `try/catch` and an inline error (`CustomerDialog.tsx:41-48`).
- Clearing the amount field must not surface "Expected number, received nan"
  (`TransactionDialog.tsx:209`; `lib/validation.ts:12`).
