# Design: Analytics, Infinite Scroll Pagination, and Mobile Profile Polish

## Context

User feedback highlighted several functional and visual refinements required across Ledger-X:
1. **Web Analytics**: Top debtors and aging breakdown need reliable data availability without depending on administrative flags.
2. **Web Settings**: The page needs a clean tabbed layout to separate Account details, Data portability, and Security.
3. **Mobile Home Screen**: The greeting should reflect the actual user's name ("Namaste, [Name]") instead of email handles, and hero analytics (total outstanding, aging strip, top debtors) must be prominently displayed.
4. **Transaction Pagination**: Customer detail pages on both mobile and web must fetch 10 items at a time and paginate infinitely upon scroll.
5. **Customer Details Navigation**: Users need bottom navigation available directly from inside customer details to avoid deep back navigation.
6. **Edit Transaction Modal**: The modal header must have proper safe-area top inset padding to clear the device battery icon and status bar.
7. **Mobile Profile Page**: Redesign the profile page with user profile image/avatar, user name, tabs for Data and Security, enhanced invitation, session info, and bottom logout.

## Goals / Non-Goals

**Goals:**
- Provide reliable receivables analytics (aging buckets: 0–30d, 31–60d, 60+d; top debtors; total receivables) on both web and mobile.
- Implement responsive infinite scrolling (pageSize: 10) on mobile and web customer transactions with filter support.
- Render persistent bottom navigation in mobile customer details matching the main tab bar.
- Protect the edit transaction modal header with dynamic top insets (`useSafeAreaInsets`).
- Deliver a segmented mobile profile page with user avatar, name, tabs for Data and Security, and a bottom logout button.
- Restructure the web settings page into intuitive tabs: Account, Data & Export, and Security.

**Non-Goals:**
- Rewriting underlying accounting/balance calculation formulas in `apps/api/src/lib/receivables.ts`.
- Replacing the auth system (Better Auth remains standard).

## Decisions

### 1. Decoupling Customer Balances from the `collection` Flag
- **Problem**: When the `collection` feature flag is off, `/collection` returns 404, causing customer lists to assume all customers are "Settled" with 0 balance.
- **Solution**: Compute and include `outstanding` and `ageDays` directly in customer balance aggregations or provide an open balance map endpoint, allowing customer lists and dashboard widgets to display true balances regardless of whether the dedicated collections module is turned on.

### 2. Infinite Scroll Transaction Pagination
- **Mobile (`apps/app/app/customers/details.tsx`)**:
  - Replace `pageSize: 100` with `pageSize: 10`.
  - Maintain `page` state, `hasMore` indicator, and `loadingMore` state.
  - Implement `onEndReached` on the transactions `FlatList` to append the next 10 transactions.
  - Add type filter chips (`All`, `Credit`, `Debit`) at the top of the transaction list.
- **Web (`apps/web/app/(app)/customers/detail/CustomerDetailView.tsx`)**:
  - Replace click-based page numbers with an infinite query or scroll observer.
  - On reaching the bottom of the transaction container, fetch the next page of 10 items and append to the list.

### 3. Customer Details Persistent Bottom Navigation
- **Choice**: Render a custom bottom navigation bar in `apps/app/app/customers/details.tsx` matching the design system of `apps/app/app/(tabs)/_layout.tsx`:
  - 4 tabs: `Home`, `Ledger`, `Customers` (active indicator), `Profile`.
  - Fixed at the bottom with `paddingBottom: Math.max(insets.bottom, 12)` and `height: 60 + bottomPadding`.
  - Tapping any tab navigates directly to `/(tabs)/<name>`.

### 4. Modal Safe Area Spacing
- **Choice**: In `apps/app/components/EditTransactionModal.tsx`:
  - Import `useSafeAreaInsets` from `react-native-safe-area-context`.
  - Apply `paddingTop: Math.max(insets.top, 16)` to the modal header container.
  - Keep the header fixed with the scrollable form body underneath so the header is always visible while clearing notch/battery elements.

### 5. Mobile Profile Screen Segmented Tabs
- **Choice**: Redesign `apps/app/app/(tabs)/profile.tsx` with:
  - **Header Card**: User avatar (image or initial circle), user's full display name, and email.
  - **Segmented Control / Tab Switcher**:
    - `Data`: Customer CSV export, Transactions CSV export, Account JSON archive, and sample data controls (if enabled).
    - `Security`: App lock toggle, PIN configuration/change.
  - **Invite Section**: Prominent card with share button to invite fellow shopkeepers.
  - **Session & Logout**: Device session indicator and a full-width destructive Logout button fixed at the bottom.

### 6. Web Settings Page Tabbed Layout
- **Choice**: Use `@radix-ui/react-tabs` in `apps/web/app/(app)/settings/page.tsx`:
  - Tab 1: `Account`: Name, email, Google account info, UPI settings (UPI ID & Payee name).
  - Tab 2: `Data & Export`: Customer CSV, Transaction CSV, Full JSON export.
  - Tab 3: `Security`: Account deletion (gated by `account_deletion` flag) and session controls.

## Risks / Trade-offs

- **[Trade-off] Infinite scroll pagination vs jump-to-page**: Infinite scroll provides a seamless modern experience on mobile and web, but makes jumping to a specific old date less direct; mitigation: provide transaction filters (Credit/Debit and date ranges) to narrow entries quickly.
