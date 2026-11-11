# Tasks

## 1. Theme and tab shell

- [x] 1.1 Add orange/dark theme tokens and verify `apps/app` typecheck passes with new `brand-primary` used in one probe button
- [x] 1.2 Reorder tabs to Home, Ledger, Collection, Customers, Profile with orange active tint and verify Expo router shows correct active tab on each route
- [x] 1.3 Add shared `CustomerAvatar` (blue-circle initial) + row primitives and verify unit render shows initial and handles long names

## 2. Home dashboard refresh

- [x] 2.1 Build 2x2 metric cards grid wired to existing metrics/analytics and verify cards show formatted INR on device/Expo Go
- [x] 2.2 Restyle +Credit (orange solid) +Payment (outline) with Cash/UPI/Other selector into QuickEntryModal and verify modal opens with correct type/method
- [x] 2.3 Rebuild 12-month trend with orange/green series, legend, month labels plus empty state, and verify with sample-data seeded trend
- [x] 2.4 Build Top Debtors list with View All navigation and verify tap routes to customer details / Customers

## 3. Ledger filters and rows

- [x] 3.1 Add All/Credit/Payment pills + search affordance wired to client-side filter and verify filter counts match recent-transactions fixture
- [x] 3.2 Restyle ledger rows (avatar, note subtitle, green/red amounts, date) and verify credit shows `+₹`, payment shows `-₹` with INR formatting

## 4. Collection hero and quick actions

- [x] 4.1 Build Scan-to-Pay hero card with QR from `buildUpiUri`, OR divider, Share button + not-configured guidance, and verify QR scans to `upi://pay` in Expo Go
- [x] 4.2 Implement Copy UPI ID, Download QR, Print QR via clipboard/share and verify copy toast + share sheet open on Android/iOS

## 5. Customers search list

- [x] 5.1 Build search input with filter icon + orange `Unpaid Nd` rows with chevron and verify name/phone filtering is case-insensitive
- [x] 5.2 Preserve offline bar, FAB/add affordance, and empty states and verify offline banner still appears when offline

## 6. Profile menu and promo

- [x] 6.1 Build shop header, menu rows (Business Details, Payment Settings, Share App, Help & Support, About, Logout red) reusing existing settings/export/lock flows and verify each row navigates or shares as today
- [x] 6.2 Add Grow-Your-Business promo card and verify it renders without blocking menu actions

## 7. Integration verification

- [x] 7.1 Run `bun run lint`, `bun run typecheck`, `bun run test` from repo root and verify all pass
- [ ] 7.2 Visual pass on iOS + Android (Expo Go + EAS preview) against the 5 mock screens and verify tab order, orange accents, QR, and empty states with screenshots attached to change
