# Tasks

> **Reconciled before archive.** The tasks below were written against the approved mockups. The
> `audit-ui-ux-and-generate-artifacts` change later established the `mobile-visual-system`
> contract as the one the app ships, and rebuilt the screens to it — one hero figure instead of a
> 2x2 grid of white metric cards, a neutral avatar chip instead of a blue circle, a dark Quick
> actions section instead of a white card, and emerald reserved for money received. The tasks
> below record the shipped behaviour, and the `mobile-shop-ui` delta was reconciled to match it.

## 1. Theme and tab shell

- [x] 1.1 Add orange/dark theme tokens and verify `apps/app` typecheck passes with new `brand-primary` used in one probe button
- [x] 1.2 Reorder tabs to Home, Ledger, Collection, Customers, Profile with orange active tint and verify Expo router shows correct active tab on each route
- [x] 1.3 Add shared `CustomerAvatar` (neutral chip with an accessible label and a deterministic initial) + row primitives and verify unit render shows the initial and handles long names

## 2. Home dashboard refresh

- [x] 2.1 Replace the 2x2 metric cards with a single total-outstanding hero, the proportional aging strip and its legend, and one inline row of supporting stats, and verify the hero shows formatted INR on device/Expo Go
- [x] 2.2 Restyle +Credit (orange solid) and +Payment (outline) so the Cash/UPI/Other selector lives inside QuickEntryModal, and verify the modal opens with the correct type and method
- [x] 2.3 Rebuild the 12-month trend with a neutral credit series and an emerald paid series, a legend, month labels and an empty state, and verify it with sample-data seeded trend
- [x] 2.4 Build the Top Debtors list with View All navigation and verify tap routes to customer details / Customers

## 3. Ledger filters and rows

- [x] 3.1 Add All/Credit/Payment tabs with counts + an inline search field wired to client-side filter and verify filter counts match the recent-transactions fixture
- [x] 3.2 Restyle ledger rows (neutral avatar, note subtitle, signed amounts, date) and verify credit shows `+₹` in neutral ink and a payment shows `−₹` in the positive token, with INR formatting

## 4. Collection hero and quick actions

- [x] 4.1 Build the Scan-to-Pay hero with the QR from `buildUpiUri` on a white scanning plate, the share button and the not-configured guidance, and verify the QR scans to `upi://pay` in Expo Go
- [x] 4.2 Implement Copy UPI ID, Download QR and Print QR via clipboard/share on the dark surface, and verify the copy toast and the share sheet open on Android/iOS

## 5. Customers search list

- [x] 5.1 Build the search input with an inline field and rows showing the unpaid age where a balance exists, and verify name/phone filtering is case-insensitive
- [x] 5.2 Preserve offline bar, FAB/add affordance, and empty states and verify offline banner still appears when offline

## 6. Profile sections

- [x] 6.1 Replace the placeholder shop header with the signed-in account's identity and restructure Profile into identity, payment settings and session sections, reusing the existing settings/export/lock flows and verifying each row navigates or shares as today
- [x] 6.2 Keep the destructive account deletion behind a typed confirmation and verify it renders without blocking the other actions

## 7. Integration verification

- [x] 7.1 Run `bun run lint`, `bun run typecheck`, `bun run test` from repo root and verify all pass
- [ ] 7.2 Visual pass on iOS + Android (Expo Go + EAS preview) against the 5 mock screens and verify tab order, orange accents, QR, and empty states with screenshots attached to change
