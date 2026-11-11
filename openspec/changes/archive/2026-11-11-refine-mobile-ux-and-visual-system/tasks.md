# Tasks

## 1. Foundation: tokens, fonts, theme

- [x] 1.1 Add the orange/neutral/rose/emerald tokens from `design.md` to `apps/app/tailwind.config.js`, add `@expo-google-fonts/mukta`, `@expo-google-fonts/ibm-plex-mono`, and `expo-file-system` to `apps/app/package.json`, and verify `bun install` and `bun run typecheck` succeed
- [x] 1.2 Load the four Mukta weights and one IBM Plex Mono weight in the root layout, register each weight as a named family, and verify the app boots with Mukta visible on a probe screen and falls back to system sans instead of a blank screen when font loading fails
- [x] 1.3 Set `userInterfaceStyle` to `dark` in `apps/app/app.json` and verify a device set to light mode still renders the dark surfaces and a light status bar
- [x] 1.4 Write `docs/mobile-visual-system.md` with the token table, type scale, surface/radius rules, and money-color meanings, and verify every value matches `tailwind.config.js`

## 2. Shared visual primitives

- [x] 2.1 Build `Button` (primary, secondary, ghost, danger), `SectionHeader` (mono label + hairline), and `MoneyText` primitives and verify each renders on Home and Profile with no hardcoded hex values in those screens
- [x] 2.2 Build `AgingStrip` with proportional and bucket modes plus `lib/aging.ts` bucket mapping, add unit tests for 0, 30, 31, 60, and 61 days, and verify `bun test` passes
- [x] 2.3 Restyle `CustomerAvatar` as a neutral chip with an accessible label and a deterministic fallback initial, and verify long and Devanagari names render without clipping or a mono fallback
- [x] 2.4 Re-theme the launch screen (`apps/app/app/index.tsx`) to the orange/neutral system and verify no green accent remains and the screen matches the new wordmark and button treatment

## 3. Home

- [x] 3.1 Replace the header with the wordmark, real first-name greeting, mono date, and no notification bell, and verify a signed-in user sees their name rather than placeholder copy
- [x] 3.2 Build the total-outstanding hero with the proportional aging strip from `analytics.aging` and a text "oldest unpaid" label, and verify the segment rupees match the sample-data aging buckets
- [x] 3.3 Replace the 2x2 white cards with one inline stat row and the primary/secondary actions, remove the Cash/UPI/Other selector, and verify both actions open `QuickEntryModal` with the method selector owned by the modal
- [x] 3.4 Clean up the 12-month trend with 3px bars, a neutral baseline, 11px mono labels, and no bar for zero values, and verify the chart is readable with sample trend data and shows the empty state with no activity
- [x] 3.5 Restyle Top Debtors rows with name, amount, bucket indicator, and age label, make View All a 44px target, and verify row and View All navigation land on the right customer or Customers list
- [x] 3.6 Verify Home loading, pull-to-refresh, zero-data, and error states render without layout jumps and without the removed filler footer

## 4. Ledger

- [x] 4.1 Replace the dead header search icon with an inline search field filtering customer name and note, and verify case-insensitive filtering and clearing restore the full recent list
- [x] 4.2 Convert the filter pills to underline tabs with counts, and verify All, Credit, and Payment counts match the loaded recent transactions and the active tab is not communicated by color alone
- [x] 4.3 Group rows by day with sticky headings and add the `Recent activity · last 5` scope label, and verify the screen makes no claim of full history or running balance
- [x] 4.4 Restyle ledger rows with signed tabular amounts, neutral text, and a date, and verify credit and payment rows use the agreed money colors plus signs and that the empty state still routes to Customers

## 5. Collection

- [x] 5.1 Make the amount optional in `buildUpiUri`, add unit tests proving the shop QR omits `am` and a customer QR includes the amount, and verify `bun test` passes
- [x] 5.2 Rebuild the QR hero on a dark surface with a brand hairline and no white Quick Actions card, and verify the shop QR scans to a `upi://pay` URI without a pre-filled amount
- [x] 5.3 Implement Download QR as a real PNG file written through `expo-file-system` and shared with `Sharing.shareAsync`, implement Print QR through `expo-print`, and verify both on iOS and Android or remove the action that cannot complete reliably
- [x] 5.4 Add a visible `Largest / Oldest` sort control wired to the existing sort state and verify the list reorders by amount and by age
- [x] 5.5 Restyle collection rows with avatar, amount, bucket indicator, and a 44px QR control, and verify missing UPI setup shows visible guidance while the empty state offers a next action

## 6. Customers

- [x] 6.1 Remove the dead header magnifier and filter icon, keep one search field, and verify name and phone filtering plus the no-results state
- [x] 6.2 Restyle rows so name, phone, outstanding amount, and aging indicator are always visible when a balance exists, and verify debtor and settled rows against sample data
- [x] 6.3 Verify the add FAB remains reachable over long lists and the offline bar still appears when offline

## 7. Profile

- [x] 7.1 Replace the hardcoded `My Shop` / `Ledger-X User` header with the real account name and email from the session and settings, and verify a signed-in user sees their own identity
- [x] 7.2 Restructure Profile into identity, settings sections, and a session section; remove the placeholder Business Details, Help & Support, and About rows, remove the duplicate logout, and verify exactly one logout control remains
- [x] 7.3 Keep the UPI settings form and its validation/save behavior inside the Payment settings section, and verify an invalid ID is rejected and a valid ID saves
- [x] 7.4 Collapse account deletion into a row that opens a confirmation sheet with the DELETE input, and verify no single tap can delete the account
- [x] 7.5 Make the growth promo card either a real share action or remove it, and verify tapping it opens the OS share sheet or the card is absent

## 8. Cross-screen behavior and accessibility

- [x] 8.1 Fix `QuickEntryModal`'s submit button with a visible primary fill, readable label, and light spinner, and verify credit and payment submission works online and queues offline
- [x] 8.2 Correct `OfflinePendingBar` icon and color logic for online, offline, syncing, and failed states, and verify each state shows an icon and text that agree
- [x] 8.3 Audit every text/background token pair against WCAG AA and fix any pair below 4.5:1 for normal text (including white-on-orange fills), and verify with recorded contrast values plus a device screenshot
- [x] 8.4 Add a visible pressed state to every Pressable (tabs, rows, filters, buttons, icon actions), respect reduced-motion settings for underline transitions, and verify taps show feedback before navigation
- [x] 8.5 Run `bun run lint`, `bun run typecheck`, and `bun run test` from the repo root, and verify all three pass
- [ ] 8.6 Capture iOS and Android screenshots of the launch screen and all five tabs in loaded, empty, and offline states, and verify each screen against `specs/mobile-visual-system/spec.md` and the composition in `design.md`

## Workflow follow-up

- Reconcile the in-progress `mobile-five-screen-ui-refresh` change (`mobile-shop-ui` delta) with `mobile-visual-system` before archiving either change.
- Archive this change after review and screenshot verification are complete.
