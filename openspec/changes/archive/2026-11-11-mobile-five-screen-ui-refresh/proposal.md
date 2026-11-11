# Proposal

## Why

The mobile app works functionally but its current screens diverge from the approved 5-screen shopkeeper mockups (Home, Ledger, Collection, Customers, Profile). Shopkeepers need a consistent dark + orange visual language with scannable cards, avatar lists, and one-tap collection that matches the design they were shown.

## What Changes

- **Home / Dashboard**: 2x2 metric cards (Total Balance, Total Customers, This Month, To Collect), `+ Credit` (solid orange) + `+ Payment` (outline) actions, Cash/UPI/Other segmented selector, 12-month Credit vs Paid trend chart, Top Debtors list with View All.
- **Ledger**: Search affordance, All/Credit/Payment filter pills, avatar + name + subtitle rows with green/red amounts and dates.
- **Collection**: Orange-bordered Scan-to-Pay hero card with centered QR, `OR Share QR Code` action, Quick Actions card (Copy UPI ID, Download QR, Print QR).
- **Customers**: Search bar with filter icon, avatar rows showing `Unpaid Nd` in orange, outstanding amount, chevron navigation.
- **Profile**: Shop avatar header (My Shop / Ledger-X User), menu rows (Business Details, Payment Settings, Share App, Help & Support, About Ledger-X, Logout in red), Grow-Your-Business promo card.
- **Global tab bar**: Home, Ledger, Collection, Customers, Profile with orange active state, dark background `#0A0A0A`-style, preserved navigation routes.

## Capabilities

### New Capabilities
- `mobile-shop-ui`: Five-tab shopkeeper UI contract for Home, Ledger, Collection, Customers, Profile — layout, visual hierarchy, filtering/search, navigation, and empty/loading states. No backend contract changes.

### Modified Capabilities
- None. Existing backend specs (dashboard analytics, collection/FIFO aging, customer aggregates, auth, exports) are reused as-is; this change only restyles and reorganizes existing data on mobile.

## Impact

- Affected code: `apps/app/app/(tabs)/*` (home, ledger, collection, customers, profile, _layout), `apps/app/components/*` (MetricCard, QuickEntryModal, trend chart, QR sheet), theme tokens (orange accent, card surfaces).
- No API, DB, or web-app changes. No new dependencies expected beyond existing `react-native-qrcode-svg`, `expo-sharing`, chart primitives.
- Risk: orange re-theme touches shared components — keep green/red semantic colors for credit/paid and isolate orange to primary actions/active states.
