# Proposal: Analytics, Infinite Scroll Pagination, and Mobile Profile Polish

## Why

Following physical device and web testing, several gaps and UX improvements have been identified across Ledger-X web and mobile apps:

1. **Web Analytics (Top Debtors & Receivables Aging)**:
   - On the web dashboard, users need clear visibility into their top debtors and receivables aging breakdown (0–30 days, 31–60 days, 60+ days) so they can track unpaid credit and collection urgency immediately.
   - Customer balances on the web customers page were tied to the `/collection` endpoint which 404s when the `collection` feature flag is off, causing customers to erroneously show as "Settled".

2. **Web Settings Page Tabbed Layout**:
   - The web Settings page currently presents a long, unorganized single-column form. Users need a clean, structured tabbed interface (e.g., "Account & Profile", "Data & Export", "Security") matching the design system.

3. **Mobile Home Screen Hero & Analytics**:
   - The "Namaste" greeting currently falls back to parsing the email local-part (e.g., "Namaste, Vijaykumar808050") instead of displaying the user's actual Google profile name.
   - The hero card must reliably display the total outstanding receivables, aging indicators (0–30, 31–60, 60+ days), and the list of top debtors.

4. **Customer Transaction Pagination & Infinite Scroll (Mobile & Web)**:
   - **Mobile**: The customer details screen currently loads all transactions in a single query with no pagination or filters. It needs to fetch only 10 transactions initially, support infinite scroll on scroll, and offer credit/debit filters.
   - **Web**: The customer details view uses click-based page numbers (`1 to 10`). Users prefer modern infinite scrolling where scrolling down automatically loads additional transaction batches of 10 items, while keeping the filter and search controls intact.

5. **Mobile Navigation from Inside Customer Details**:
   - When navigating into `/customers/details`, the bottom navigation tab bar is hidden, requiring users to repeatedly press Back to reach other tabs. Providing persistent tab navigation allows rapid jumping between Home, Ledger, Customers, and Profile.

6. **Mobile Edit Transaction Modal Safe-Area Header**:
   - In `EditTransactionModal`, the modal header ("X" close button and "Save" button) collides with the device status bar and battery icon because top safe-area insets are not applied. Safe padding must be added.

7. **Mobile Profile Page Redesign**:
   - The mobile Profile screen needs a comprehensive visual upgrade:
     - Prominent user profile picture / avatar (Google profile picture with initial fallback), user name, and email.
     - Organized tabs/segments:
       - **Data & Export**: Download Customers CSV, Transactions CSV, Full account JSON archive (and sample data if flag enabled).
       - **Security**: App lock / Require PIN to open configuration.
       - **Invite**: Enhanced "Invite a shopkeeper" share card.
       - **Sessions & Logout**: Clean session indicator and prominent, accessible Logout button at the bottom.

## What Changes

- **Web Dashboard & Receivables**:
  - Verify and ensure `/dashboard/analytics` reliably computes and returns top debtors, aging buckets ("0-30", "31-60", "60+"), and total receivables.
  - Decouple customer balance presentation from the restricted `collection` feature flag so web and mobile customer lists accurately reflect outstanding debts without returning 404.
- **Web Settings Page**:
  - Refactor `apps/web/app/(app)/settings/page.tsx` using Radix `Tabs` (`TabsList`, `TabsTrigger`, `TabsContent`):
    - Tab 1: **Account** — User profile info (name, email, avatar), UPI payment settings.
    - Tab 2: **Data & Export** — Customers CSV, Transactions CSV, Account JSON archive, and sample data controls.
    - Tab 3: **Security** — Danger zone account deletion (when feature flag enabled) and session sign-out.
- **Mobile Home Screen**:
  - Update `apps/app/lib/auth-session.ts` and `apps/app/app/(tabs)/home.tsx` to read the user's actual `name` (from OAuth session/API) and format the greeting nicely ("Namaste, [Name]").
  - Ensure total outstanding receivables, proportional aging strip, and top debtors list render correctly and handle zero/positive balance states cleanly.
- **Customer Transactions Infinite Scroll**:
  - **Mobile (`apps/app/app/customers/details.tsx`)**:
    - Implement page-by-page fetching with `pageSize: 10`.
    - Hook into `onEndReached` to dynamically fetch next pages.
    - Add filter buttons (`All`, `Credit`, `Debit`) to easily filter transaction history.
  - **Web (`apps/web/app/(app)/customers/detail/CustomerDetailView.tsx`)**:
    - Replace the click-based `TransactionPagination` with an infinite scroll loader (via scroll detection / `useInfiniteQuery`).
    - Load 10 transactions per batch as user scrolls down.
- **Mobile Navigation in Customer Details**:
  - Add a bottom navigation bar to `apps/app/app/customers/details.tsx` matching the tab bar styling (`Home`, `Ledger`, `Customers`, `Profile`) with active state on Customers.
- **Mobile Edit Transaction Modal Header**:
  - Apply `useSafeAreaInsets()` with `paddingTop: Math.max(insets.top, 16)` to the header of `EditTransactionModal`, creating safe distance from the battery indicator and status bar.
- **Mobile Profile Page Redesign**:
  - Redesign `apps/app/app/(tabs)/profile.tsx` with:
    - User avatar component (image if available, styled initials fallback), full user display name, and email.
    - Segmented tabs: `Data` (CSV and JSON exports) and `Security` (App PIN lock).
    - Polished "Invite a shopkeeper" share card.
    - Session info and a distinct, full-width destructive Logout button at the bottom.

## Capabilities

### Modified Capabilities
- `mobile-shop-ui`: Redesign Profile screen with avatar, username, and segmented tabs; add bottom navigation to Customer Details; fix safe area padding in Edit Transaction modal; add infinite scroll and filters to Customer Transactions; show proper user greeting on Home.
- `dashboard-analytics`: Ensure top debtors, receivables aging, and total receivables are accessible and correctly rendered across web and mobile.
- `web-visual-system`: Reorganize Settings page into a modern tabbed layout; update Customer Details to use infinite scroll pagination for transactions.

## Impact

- `apps/app/app/(tabs)/home.tsx`: Name greeting, total outstanding, aging strip, top debtors.
- `apps/app/app/(tabs)/profile.tsx`: Full redesign with avatar, tabs, data export, security, invite, logout.
- `apps/app/app/customers/details.tsx`: Infinite scroll pagination (10/page), type filters, bottom navigation bar.
- `apps/app/components/EditTransactionModal.tsx`: Safe area top padding below status bar/battery icon.
- `apps/app/lib/auth-session.ts`: Include `name` and `image` in `SessionUser`.
- `apps/web/app/(app)/settings/page.tsx`: Tabbed settings layout.
- `apps/web/app/(app)/customers/detail/CustomerDetailView.tsx`: Infinite scroll transaction list.
- `apps/api/src/routes/customers.ts` & `dashboard.ts`: Customer balances availability without 404 flag restriction.
