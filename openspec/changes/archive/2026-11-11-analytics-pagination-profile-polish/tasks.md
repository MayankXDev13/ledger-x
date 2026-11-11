# Tasks

## 1. Web & Mobile Receivables and Balances Availability

- [x] 1.1 In `apps/api/src/routes/customers.ts`, provide balances (outstanding and oldest unpaid age) directly with customer listings or expose a balance summary endpoint so customer lists do not depend on the restricted `collection` feature flag.
- [x] 1.2 Verify `apps/web/app/(app)/dashboard/page.tsx` and `apps/app/app/(tabs)/home.tsx` receive and display `totalReceivables`, aging buckets ("0-30", "31-60", "60+"), and `topDebtors`.

## 2. Web Settings Page Tabbed Restructure

- [x] 2.1 Refactor `apps/web/app/(app)/settings/page.tsx` into a tabbed layout using Radix Tabs (`TabsList`, `TabsTrigger`, `TabsContent`):
  - "Account" tab: Profile details, Google connection, and UPI payment settings.
  - "Data & Export" tab: CSV and JSON export actions, and sample data controls.
  - "Security" tab: Danger zone account deletion (when feature flag enabled) and session logout.

## 3. Mobile Home Screen Greeting & Hero Analytics

- [x] 3.1 Update `apps/app/lib/auth-session.ts` to include `name` and `image` in `SessionUser`.
- [x] 3.2 Update `apps/app/app/(tabs)/home.tsx` to display "Namaste, [Name]" using the user's actual display name or formatted name instead of raw email handles.
- [x] 3.3 Ensure the Total Outstanding hero card, aging strip with legend, and top debtors list render with full fidelity.

## 4. Mobile & Web Customer Transactions Infinite Scroll

- [x] 4.1 Update `apps/app/app/customers/details.tsx` to fetch 10 transactions initially, load subsequent pages on scroll via infinite pagination (`onEndReached`), and add transaction type filter chips (`All`, `Credit`, `Debit`).
- [x] 4.2 Update `apps/web/app/(app)/customers/detail/CustomerDetailView.tsx` to replace click pagination with an infinite scroll transaction feed that loads batches of 10 items as the user scrolls, preserving search and filters.

## 5. Mobile Navigation from Customer Details

- [x] 5.1 In `apps/app/app/customers/details.tsx`, render a fixed bottom navigation bar with icons and labels for `Home`, `Ledger`, `Customers` (active), and `Profile`, respecting bottom safe-area insets (`Math.max(insets.bottom, 12)`).

## 6. Mobile Edit Transaction Modal Safe-Area Header

- [x] 6.1 In `apps/app/components/EditTransactionModal.tsx`, apply `useSafeAreaInsets()` to the header container with `paddingTop: Math.max(insets.top, 16)` so the Close "X", title, and "Save" button sit comfortably below the device status bar and battery icon.

## 7. Mobile Profile Page Redesign

- [x] 7.1 Redesign `apps/app/app/(tabs)/profile.tsx` with:
  - User avatar with profile image or styled initials, user display name, and email.
  - Segmented tabs: `Data` (export actions) and `Security` (App PIN lock).
  - Enhanced "Invite a shopkeeper" card with share action.
  - Clean device session overview.
  - Prominent, accessible Logout button at the bottom of the screen.

## 8. Verification and Quality Checks

- [x] 8.1 Run `bun test` in `apps/api`, `apps/web`, and `apps/app` to verify all tests pass.
- [x] 8.2 Run `bun run check:visual`, `turbo run typecheck`, and `turbo run lint`.
- [x] 8.3 Verify builds and screens on device and web.
