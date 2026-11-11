# Tasks

## 1. Web token layer

- [x] 1.1 Declare the brand ramp (`--brand`, `--brand-light`, `--brand-fill`, `--brand-text`, `--positive`) in `apps/web/app/globals.css` for both `:root` and `.dark`, add matching `@theme inline` entries (`--color-brand`, `--color-brand-fill`, `--color-brand-text`, `--color-positive`), and re-point `--primary` at the brand orange; verify a script finds a `--brand:` declaration in the compiled stylesheet and that `.bg-gradient-brand` resolves to a non-transparent background
- [x] 1.2 Add the tokens that `.dark` declares but `:root` omits — at minimum `--background` and `--foreground` — so `bg-background` and `text-foreground` resolve in both themes; verify a script asserts the two theme blocks declare the same token names and that the light theme renders a non-transparent page background
- [x] 1.3 Replace every `.tabular` usage with the real `tabular-nums` utility across `apps/web`; verify a grep for `tabular` as a class name returns no usages and that amount columns in the transaction list, collection rows, statement and dashboard tiles align by digit
- [x] 1.4 Replace the `.chip-receivable` / `.chip-payable` / `.chip-settled` usages in `components/customers/CustomerProfileHeader.tsx` with the existing `Badge` primitive using token-driven variants; verify the customer profile header shows styled Receivable, Payable and Settled pills in a screenshot
- [x] 1.5 Resolve the remaining undefined utilities: define `.safe-area-bottom` as `padding-bottom: env(safe-area-inset-bottom)`, and either define `.card-hover` and `.fade-up` (with reduced-motion handling) or remove their usages; verify a grep for custom utility class names finds each one either defined in `globals.css` or absent from the sources
- [x] 1.6 Set a real radius scale in `globals.css` (card 16, control 12, chip full) so shadcn components and hand-rolled components share one radius language; verify shadcn `Button`, `Input` and `Dialog` match the hand-rolled cards and chips in a screenshot review
- [x] 1.7 Remove the two unused font loads (`Geist`, `Geist Mono`) from `apps/web/app/layout.tsx`, keeping Source Sans 3 for UI and JetBrains Mono for numerals; verify `bun run build` in `apps/web` succeeds and the rendered page still uses the two intended families
- [x] 1.8 Update `design-system/ledger-x/MASTER.md` and `design-system/ledger-x/pages/*.md` to match the shipped web token names and the `--radius` scale; verify every token name in the docs exists in `apps/web/app/globals.css`

## 2. Web money semantics and charts

- [x] 2.1 Add `apps/web/lib/money.ts` mapping a transaction to `{ tone, sign, label }` for credit, payment-with-method, plain debit and overdue, and cover all four with unit tests; verify `bun test` in `apps/web` passes with the new cases
- [x] 2.2 Add `apps/web/lib/format.ts` with a single `formatCurrency` (`en-IN`, INR, no fraction digits) and migrate the five duplicated copies in `CustomerProfileHeader`, `CustomerAnalyticsCards`, `CustomerHeader`, `TransactionItem` and `StatementView`; verify a grep finds exactly one `formatCurrency` definition in `apps/web`
- [x] 2.3 Apply the money helper in `components/transactions/TransactionItem.tsx` so a received payment renders in the positive token and a credit renders neutral with a `+` sign; verify a screenshot of the transaction list shows the three states with signs intact
- [x] 2.4 Adopt the shipped `components/ui/chart.tsx` wrapper with a token-driven `ChartConfig` for the three dashboard charts, using a neutral tone for credit and `--positive` for paid; verify the compiled dashboard chunk contains no literal hex chart colors
- [x] 2.5 Differentiate the credit and paid series by fill pattern and direct label in addition to hue, add a text legend to every chart panel, and render a one-sentence trend summary plus a twelve-month data table under the 12-month panel; verify each chart exposes an accessible name and the table lists all twelve months
- [x] 2.6 Fix the dashboard tooltip so it preserves the sign of the value instead of formatting the absolute value; verify hovering a credit and a payment shows opposite directions in the tooltip
- [x] 2.7 Make chart grid, axis, and series colors theme-aware so the charts are legible in the light theme; verify a light-theme screenshot of the dashboard shows visible grid lines and axis labels
- [x] 2.8 Replace the five purple `--chart-*` tokens with a distinct, theme-aware series ramp and verify each token differs from the others in both theme blocks

## 3. Web accessibility and navigation

- [x] 3.1 Make the row edit and delete actions visible without a pointer hover in `TransactionItem.tsx` and `CustomerCard.tsx` (for example `focus-visible` and `group-focus-within`) and raise their size to 44px on touch viewports; verify tabbing into a row reveals the actions with the pointer away from the row
- [x] 3.2 Give every icon-only control an accessible name, starting with the `⋯` menu in `CustomerProfileHeader.tsx` and the raw `<button>` elements in `AppSidebar.tsx`, `MobileBottomNav.tsx`, `collection/page.tsx` and `TransactionDialog.tsx`; verify an automated scan of the app for icon-only buttons without a label returns none
- [x] 3.3 Restore the visible focus ring that `AppSidebar.tsx:285` removes, and apply the same `focus-visible` treatment to the raw buttons that only inherit the user-agent ring; verify tabbing through the sidebar shows a visible indicator on every stop
- [x] 3.4 Separate the interactive buttons nested inside the customer-card `<Link>` so no interactive content sits inside an anchor; verify activating the card navigates and the action buttons still work independently
- [x] 3.5 Give the sidebar `<nav>` an accessible name so the two navigation landmarks are distinguishable, and add `aria-current="page"` to the hand-rolled breadcrumbs in `collection`, `settings`, `CustomerDetailView` and `StatementView`; verify the landmarks report distinct names and the current breadcrumb is marked programmatically
- [x] 3.6 Replace the hand-rolled breadcrumbs with the shipped `components/ui/breadcrumb.tsx` primitive where the layout allows; verify the breadcrumb renders the same labels with a marked current page
- [x] 3.7 Name the chart canvases, set `scope="col"` on the statement table headers, and replace the plain `<p>` used as a dialog description with `DialogDescription` in `CustomerDialog` and `TransactionDialog`; verify the dialog announces a description and the table headers expose their column

## 4. Web forms, states and layout

- [x] 4.1 Stop gating submission on `formState.isValid` in `CustomerDialog` and `TransactionDialog`: keep the submit enabled, validate on blur, and render the field error next to the input; verify an empty required field shows a message naming what is missing instead of a permanently disabled button
- [x] 4.2 Wrap both `handleSubmit` implementations in error handling and render an API failure inline in the dialog; verify a failed create keeps the dialog open and shows the failure
- [x] 4.3 Associate validation errors with their fields using `aria-describedby` and `aria-invalid` in `CustomerDialog`, `TransactionDialog` and the settings UPI form, and announce them; verify a screen reader receives the error when it appears
- [x] 4.4 Turn the settings UPI section and the statement period filter into real forms with a submit button so Enter saves, and reject a period whose start is after its end with an inline message; verify Enter in the UPI field saves and an inverted period shows an error
- [x] 4.5 Replace the raw `NaN` validation message with a human-readable one and clear the field error when the input becomes valid; verify clearing the amount field shows a readable message
- [x] 4.6 Add visible labels to the customer-detail transaction search and an accessible name to its filter select; verify both controls expose a name and are reachable by keyboard
- [x] 4.7 Stop rendering a failed request as an empty or all-clear state in the collection list, the customer list and the dashboard metrics, and give each an error state with a retry action; verify a failed request shows a retry rather than "nothing to show"
- [x] 4.8 Add `error.tsx`, `loading.tsx` and `not-found.tsx` for the app routes and verify a throwing route renders the boundary instead of a blank page
- [x] 4.9 Make the collection amount block truncate instead of forcing horizontal overflow and wrap the statement table in an `overflow-x-auto` container; verify at a 360px viewport that the page itself does not scroll horizontally and the statement columns stay readable
- [x] 4.10 Keep the mobile bottom navigation and the fixed action bars clear of the device home indicator using the `.safe-area-bottom` utility; verify a 390×844 screenshot shows the bar content fully visible
- [x] 4.11 Remove the duplicate primary action on the customer list so only one "Add Customer" action is offered below the `lg` breakpoint; verify a 375px screenshot shows exactly one primary action
- [x] 4.12 Invalidate the customer detail and dashboard queries after a customer delete and navigate away from the deleted record's page; verify deleting a customer leaves the detail page and refreshes the dashboard totals
- [x] 4.13 Raise the web minimum text size to 12px by replacing the `text-[9px]`, `text-[10px]` and `text-[11px]` usages with a 12px step or a named token; verify a grep for sub-12px arbitrary sizes returns none and the affected labels still fit
- [x] 4.14 Use one post-login landing route for the auth callback and the auth guard, and render the real customer creation date instead of the current month; verify signing in lands on the same route from either entry point and a customer shows their actual join month
- [x] 4.15 Align the four loaded web icon libraries down to one and remove the unused `@hugeicons` packages, then remove the orphaned `forgot-password`, `reset-password`, `signup/LogoSection` and duplicated `customers/CustomerHeader` modules together with the duplicated `hooks/useMobile.ts`; verify `bun run lint`, `bun run typecheck` and `bun run build` pass in `apps/web` and no orphaned module remains imported

## 5. Mobile Home re-base

- [x] 5.1 Rebuild `apps/app/app/(tabs)/home.tsx` on the dark primitives: neutral-950 background, neutral-900 surfaces, 1px hairlines, no white content cards, and one hero figure for total outstanding; verify a device screenshot of Home shows no white card and a single dominant amount
- [x] 5.2 Move the aging strip onto the dark surface and adopt `AgingLegend` as the single legend for the strip and the top-debtors list so both use one color map; verify the strip segments are legible against the surface and match the legend swatches
- [x] 5.3 Re-label the 12-month trend legend so it matches the bar colors, use `brand-fill` behind white labels on orange, and correct every sub-4.5:1 text pair on the screen; verify a contrast measurement of each token pair on the Home background passes 4.5:1
- [x] 5.4 Add the "add your first customer" path to the zero-data Home state and verify the zero hero renders a formatted zero with the action
- [x] 5.5 Adopt `ScreenContainer` with the 20px gutter across the Home screen and delete the unused `MetricCard` component that implements the banned white-metric-card pattern; verify no `MetricCard` import remains and the Home gutter measures 20px
- [x] 5.6 Update `docs/mobile-visual-system.md` with the aging color map, the Home surface rules and the pressed-feedback timing; verify every value in the doc matches `apps/app/tailwind.config.js` and the implemented components

## 6. Mobile color, accessibility and control sweep

- [x] 6.1 Turn `apps/app/lib/theme.ts` into the single runtime source, exporting the brand, positive, danger, neutral, spacing, radius and type-scale constants that inline styles can use, and import it in place of the literal hex values; verify `lib/theme.ts` is imported by the screens and no screen declares a raw color constant
- [x] 6.2 Migrate the customer sub-screens (`customers/add.tsx`, `customers/edit.tsx`, `customers/details.tsx`, `customers/statement.tsx`) off `#3B82F6` and `bg-blue-500` onto the brand token, and verify the primary Save buttons render in brand orange with an accessible label
- [x] 6.3 Migrate `ledger/add.tsx`, `QuickEntryModal`, `EditTransactionModal`, `DeleteConfirmationDialog`, `OnboardingDialog`, `AppLockGate`, `PaymentMethodSelector` and `DateFilterDropdown` onto the brand and role tokens, replacing `#10B981` outside the money-received role and `#F59E0B` on money; verify no blue or amber literal remains outside the money role
- [x] 6.4 Correct the money semantics on mobile: a credit given renders neutral with a `+` sign, a received payment renders in the positive token, an outstanding balance stays neutral until 60+ days, and the "You owe" / "We owe" copy matches the sign of the balance; verify a screenshot of the customer detail shows the corrected states
- [x] 6.5 Give every pressable an accessible role, an accessible label, and an accessible state where it toggles, across the tabs, modals, dialogs and customer screens; verify an automated scan finds no pressable without a role
- [x] 6.6 Announce asynchronous status — sync state, lock errors, the QR opening, and the result of a save — through a live region or an explicit announcement; verify a screen reader receives the sync-state change
- [x] 6.7 Raise every touch target to at least 44×44 points, including the offline-bar retry and discard buttons, the modal close buttons, the statement share and apply controls, and the customer-screen back arrows, adding `hitSlop` where the visual size must stay small; verify an automated scan finds no target below 44pt
- [x] 6.8 Replace the invalid `min-[80px]` class with the intended minimum height and correct the other invalid utility usages; verify the note field honours its minimum height
- [x] 6.9 Change the aging indicator's accessibility role from an indeterminate progress bar to a descriptive role with the bucket values exposed; verify the indicator announces its bucket rather than an indeterminate progress bar
- [x] 6.10 Add tabular numerals to every amount renderer that does not already use the shared money component — customer balance, statement totals, and the amount inputs; verify the digit columns align in the customer and statement lists
- [x] 6.11 Add a shared pressable style built on Reanimated that applies 0.8 opacity plus a darker fill over 120ms and collapses when the device requests reduced motion, and use it for the buttons, rows, tabs and filters that currently jump instantly; verify a screen recording shows the pressed state and that reduced motion removes the transition
- [x] 6.12 Replace the aging legend colors, the `#666`/`#777` text colors, the `elevation: 4` shadow, the off-contract radii and gutters, the white primary button in `ledger/add.tsx`, and the legacy `brand-*` alias tokens with the contract values; verify a contrast scan of the app finds no text pair below 4.5:1 and no shadow on a dark surface
- [x] 6.13 Add a repo check that fails when a forbidden literal — the blue family, the non-token greys, or the emerald and amber values used outside the money role — appears in the mobile sources; verify the check passes after the migration and fails when a forbidden literal is reintroduced

## 7. Mobile shared state and honest screens

- [x] 7.1 Add a session provider that resolves the Better Auth session once and exposes it to every screen, and change `useAuth()` to read from it; verify a cold start performs one session request and every screen shows the same account
- [x] 7.2 Add a settings provider that owns the `/settings` fetch and its mutation, and change `useSettings()` to read from it; verify Profile and Collection no longer keep divergent local copies of the settings
- [x] 7.3 Add an offline-queue provider that owns `initQueue()` and `processQueue()`, change `useOfflineQueue()` to read from it, and add a test that three mounted screens replay a queued item exactly once; verify `bun test` in `apps/app` passes and the pending-bar count equals the queue length
- [x] 7.4 Make the auth guard wait for the session to resolve before redirecting, and use one canonical landing route in the login screen and the guard; verify signing out does not bounce back into the app and signing in lands on the same route from either entry point
- [x] 7.5 Render visible error states instead of `console.error` on the Ledger, Customers, Collection and customer-detail screens, with a retry action; verify a failed request shows an error rather than "No transactions yet"
- [x] 7.6 Replace the silent amount validation in `QuickEntryModal` and `EditTransactionModal` with a visible rejection message next to the amount field, and confirm a successful save on every save screen; verify an invalid amount produces a message and a valid save is confirmed before the screen closes
- [x] 7.7 Add visible labels to the UPI fields on Profile, associate the validation error with the field, and add the missing keyboard types, autocorrect settings and content types to the customer and statement inputs; verify each input has a visible label and a numeric keypad where it expects a number
- [x] 7.8 Wrap the add-customer and add-ledger forms in a scrollable, keyboard-avoiding container with the bottom safe-area inset applied, and remove the hardcoded top padding in `ledger/add.tsx`; verify the Save and Cancel controls remain reachable with the keyboard open at 360×640
- [x] 7.9 Let the tab bar size itself to the safe area instead of setting an explicit height, set the tab label font to the UI family, and correct the active tint to the brand token; verify the tab labels are not clipped on a notched device and the active tab uses the brand orange
- [x] 7.10 Make the queued offline entries appear in Home, Customers and Collection without waiting for a server refetch, so the screens reflect what the user just recorded; verify an entry recorded offline appears once in the list and is not duplicated after the sync completes

## 8. Integration verification

> **8.4 is blocked in this environment.** The mobile matrix needs an iOS device, an Android device
> and an emulator. None is attached here (`adb devices` is empty, there is no iOS simulator
> reachable, and Agent device access is off), so that matrix could not be captured and the task is
> deliberately left unchecked. The web matrix (8.3) **was** captured — `scripts/capture-web.ts`
> drives the locally installed Chrome over CDP against the production build with the mock API
> behind it — and the review it produced is recorded in `docs/ui-ux-verification.md`, along with
> the four defects it found and fixed. Everything verifiable without a device was verified.

- [x] 8.1 Run the token-resolution script over the web build and fail on any referenced custom property or custom utility class that has no declaration; verify the script exits zero after the web work and fails when a token is removed
- [x] 8.2 Run the contrast script over every token pair named in the specs for both themes and confirm each meets its stated floor; verify the script reports no failing pair
- [x] 8.3 Capture the web screenshot matrix — login, dashboard, customers, customer detail, statement, collection, settings, plus a 360px pass — in the dark theme and the light theme, and review each against `specs/web-visual-system/spec.md`; verify every screenshot is attached to the change and each checklist item is confirmed
- [ ] 8.4 Capture the mobile screenshot matrix — launch screen, the five tabs, add and edit customer, statement, and the app lock — in loaded, empty and offline states on both an iOS and an Android build, and review each against `specs/mobile-visual-system/spec.md`; verify every screenshot is attached and each checklist item is confirmed
- [x] 8.5 Run `bun run lint`, `bun run typecheck` and `bun run test` from the repository root and verify all three pass with no new failures; verify the CI command output is attached to the change
- [x] 8.6 Re-read `openspec/changes/refine-mobile-ux-and-visual-system/tasks.md` and mark this change's findings against the earlier change's tasks, confirming which earlier tasks were checked off without the behavior being present; verify the discrepancy list is attached to the change for the follow-up archive decision

## Workflow follow-up

- Do not archive `refine-mobile-ux-and-visual-system` or `mobile-five-screen-ui-refresh` from this change; the discrepancy list from task 8.6 is the input to that decision.
- Reconcile the `mobile-shop-ui` delta in `mobile-five-screen-ui-refresh` with the `mobile-visual-system` capability before either change is archived.
- Archive this change after the screenshot verification in tasks 8.3 and 8.4 is accepted.
