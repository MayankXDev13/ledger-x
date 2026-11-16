# Tasks

## 1. Shared language and helpers

- [x] 1.1 Add `apps/web/lib/labels.ts` exporting `TOTAL_OUTSTANDING_LABEL = "Total outstanding"` and an `oldestUnpaidLabel(days: number)` helper returning `Oldest unpaid N days`; verify a unit test covers 0, 1 and 38 days
- [x] 1.2 Add a `balanceTone(ageDays: number | null)` helper to `apps/web/lib/money.ts` returning `neutral` below 60 days and `danger` at 60 or above, with unit tests at 59 and 60; verify no other screen hardcodes the 60-day boundary for colour
- [x] 1.3 Replace "Total balance", "Overall ledger balance" and "Total receivables" with the shared constant on dashboard and collection; verify a grep finds no old labels
- [x] 1.4 Replace abbreviated "Unpaid Nd" and "Oldest unpaid: N days" strings with `oldestUnpaidLabel` on customer cards, collection rows and customer detail; verify all three screens show the full phrase

## 2. Dashboard hierarchy on mobile

- [x] 2.1 Restructure the dashboard hero and three stat tiles into one outstanding hero card plus one compact two-cell stat row below `lg`; verify at 360×800 the hero and the record action are visible without scrolling
- [x] 2.2 Add "Record payment" as the primary action and "Give credit" as secondary on the dashboard, both opening the existing transaction dialog with the kind preselected; verify one tap opens the dialog with the correct default and no customer-picker step
- [x] 2.3 Demote "Add Customer" to a named icon control in the dashboard header below `lg`; verify exactly one full-emphasis primary action remains on the screen
- [x] 2.4 Keep the 1440px dashboard layout otherwise unchanged; verify a 1440 screenshot still shows three stat tiles in a row and both charts

## 3. One primary action and neutral balance on customer detail

- [x] 3.1 Remove or demote the in-card "+ Add" on customer detail so the sticky bottom bar is the only full-emphasis action; verify one primary at both 360 and 1440
- [x] 3.2 Apply `balanceTone` to the current-balance hero so it is neutral below 60 days and danger text at 60+, keeping the "Receivable from customer" text; verify a 12-day customer renders neutral and a 66-day customer renders danger text
- [x] 3.3 Below `sm`, render the four customer-detail statistics as stacked hairline rows without icons; verify no label wraps and the 360px screenshot shows all four figures legibly

## 4. Collection compaction

- [x] 4.1 Merge the total and UPI cards on `/collection` into one compact block, with the UPI id, Copy link and QR on a single line; verify at 360px the first outstanding row is visible without scrolling
- [x] 4.2 Move the aging label above the action buttons on narrow viewports and apply `whitespace-nowrap`; verify "Oldest unpaid 38 days" never overlaps Copy link or QR
- [x] 4.3 Replace the filled "By amount / By age" pills with underline tabs using the existing tab styling and `aria-selected`; verify the active tab shows a two-pixel underline at both widths

## 5. Customer card legibility

- [x] 5.1 Restructure `CustomerCard.tsx` so the name has its own line with at least 60 percent of the row width and a truncation threshold around 18 characters, with the outstanding amount and aging on a second line
- [x] 5.2 Remove the phone number from the customer card and rely on the detail screen; verify a 360px screenshot shows "Sunita Devi", "Meena Traders" and "Priya General Store" without losing their distinguishing words
- [x] 5.3 Keep 44px minimum touch targets on the edit and delete controls; verify the action column still fits at 360px without horizontal page scroll

## 6. Login copy and accessibility

- [x] 6.1 Rewrite the brand panel headline and body in plain product language and remove the "1-Tap UPI collection" claim and vanity metrics; verify no stat tile shows 0, infinity, latency or uptime
- [x] 6.2 Replace the three stat tiles with honest benefits: "Zero paper slips", "UPI collection link", "Works offline"; verify each phrase is present in the rendered page
- [x] 6.3 Raise small brand-panel labels from `text-white/80` to a colour that clears 4.5:1 against the darker end of the gradient; verify with `bun run check:contrast`
- [x] 6.4 Change the brand headline from `<h1>` to `<p>` and keep "Welcome back" as the only `<h1>`; verify one level-one heading in the page snapshot

## 7. Statement and navigation polish

- [x] 7.1 Put Start date, End date, Apply and Clear in one `flex-wrap` row with consistent gaps so Clear is not stranded; verify at 360px the controls wrap as a row
- [x] 7.2 Give the generated timestamp `whitespace-nowrap` and enough width to avoid a mid-phrase break; verify at 360px it renders on one or two clean lines
- [x] 7.3 Use one label for the collection destination in `AppSidebar.tsx` and `MobileBottomNav.tsx`; verify both read "Collection" and no screen reads "Collect"

## 8. Documentation and verification

- [x] 8.1 Update `design-system/ledger-x/MASTER.md` and the affected `pages/*.md` with the new hierarchy, balance tone, labels and login copy rules; verify every new token and helper name exists in code
- [x] 8.2 Run `bun run check:visual`, `bun run lint`, `bun run typecheck` and `bun run test`; verify all pass with no new violations
- [x] 8.3 Build the web app and capture a fresh 1440px and 360px screenshot matrix for all seven screens in both themes into this change's `screenshots/web` folder; verify no screen scrolls horizontally at 360px
- [x] 8.4 Review the fresh matrix against the acceptance scenarios above and record any remaining gap before archive; verify every task checkbox reflects shipped behaviour
