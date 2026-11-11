# Tasks

## 1. Bottom Tab Bar Safe Area & Inset Fix

- [x] 1.1 Update `apps/app/app/(tabs)/_layout.tsx` to compute `const bottomPadding = Math.max(insets.bottom, 12);` and apply `height: 60 + bottomPadding`, `paddingBottom: bottomPadding`, `paddingTop: 8`, ensuring tab icons and text labels never clip on Android devices.

## 2. Dark Screen Transitions & Loader Backgrounds

- [x] 2.1 Update `apps/app/app/_layout.tsx` to add `backgroundColor: colors.bg` to the root container and configure `screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}` on the root Stack navigator to eliminate transition white flashes.
- [x] 2.2 Update `styles.loader` in `apps/app/app/customers/details.tsx` to include `backgroundColor: colors.bg` so loading states render on dark backgrounds.

## 3. Customer Detail Action Buttons Layout

- [x] 3.1 Refactor `apps/app/app/customers/details.tsx` action buttons from a single crammed row into a two-row hierarchy (Row 1: prominent `+ Credit` and `- Payment`; Row 2: `Statement`, `WhatsApp` with WhatsApp brand green styling, and `SMS`), ensuring labels never wrap onto two lines.

## 4. Edit Transaction Delete Action Styling

- [x] 4.1 Refactor the delete button in `apps/app/components/EditTransactionModal.tsx` into a centered, full-width destructive button with an inline trash icon, danger color tokens, and comfortable touch target.

## 5. Feature Flags for Sample Data and Account Deletion

- [x] 5.1 Register `sample_data` and `account_deletion` in `apps/api/src/lib/feature-flags.ts` and update `docs/feature-flags.md` with usage instructions.
- [x] 5.2 Gate the "Sample data" card in `apps/app/app/(tabs)/profile.tsx` behind `isEnabled("sample_data")` and the "Delete account" card behind `isEnabled("account_deletion")`.
- [x] 5.3 Guard `/sample-data` and `DELETE /account` in `apps/api` behind their respective flags, rejecting with `403` when disabled, and add contract tests in `apps/api/src/test/feature-flags.test.ts`.

## 6. Verification & Device Confirmation

- [x] 6.1 Run `bun run test` and `bun run check:visual` across the monorepo to ensure lint, TypeScript, and tests pass.
- [x] 6.2 Capture verification screenshots via `adb` on the connected device to confirm tab bar layout, customer detail action buttons, edit transaction modal, and profile screen.
