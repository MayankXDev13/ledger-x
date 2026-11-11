# Proposal: Fix Mobile UI Polish, Screen Transitions, and Feature Flags

## Why

During testing on physical Android devices running the latest EAS build of Ledger-X, several high-priority UI and navigation issues were observed:
1. **Bottom tab bar cut-off**: The bottom navigation tab bar height is collapsed (~39px) on Android, clipping the bottom tab icons and hiding tab labels beneath the system navigation bar.
2. **500ms white screen flash**: Navigating between tabs or into customer details causes a ~500ms flash of a bright white screen because the root container, Stack screenOptions, and screen loading states lack dark background styling.
3. **Customer detail action buttons wrapping**: The customer detail screen crams five action buttons into a single horizontal row (`flexDirection: "row"`), causing "Statement" and "WhatsApp" button labels to wrap awkwardly into two lines ("Stateme\nnt" and "WhatsA\npp").
4. **Edit transaction delete button aesthetics**: In `EditTransactionModal`, the delete action is an unstyled, vertically stacked icon and text awkwardly stranded on the left edge with vast empty space beneath.
5. **Sample data & Account deletion flags**: The user wants "Load sample data" and "Delete account" features removed from normal view unless explicitly enabled behind the centralized feature flag system (`sample_data` and `account_deletion`).

Fixing these issues restores a seamless dark-theme visual experience, eliminates jarring white flashes, ensures all touch targets and labels are clearly legible, and secures sensitive sample data and account deletion actions behind admin feature flags.

## What Changes

- **Tab Bar Layout**: Update `apps/app/app/(tabs)/_layout.tsx` to explicitly account for bottom safe-area insets (`Math.max(insets.bottom, 12)`), providing sufficient tab bar height (60px + insets) and proper vertical padding so icons and labels are fully visible and comfortable to tap.
- **Root Background & Dark Transitions**:
  - Update `apps/app/app/_layout.tsx` so the root `SafeAreaView` has `backgroundColor: colors.bg` (`#121212`).
  - Configure `<Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }} />` to prevent white background exposure during screen transitions.
  - Ensure `styles.loader` in `apps/app/app/customers/details.tsx` (and other screens) includes `backgroundColor: colors.bg`.
- **Customer Details Action Buttons**:
  - Refactor the action buttons on `apps/app/app/customers/details.tsx` into a structured, dual-tier layout:
    - **Primary Actions Row**: Two prominent, balanced buttons for core ledger actions: `+ Credit` (orange) and `Payment` (positive emerald).
    - **Communication & Utility Row**: Three neatly proportioned action pills: `Statement` (document text), `WhatsApp` (brand WhatsApp green styling with `logo-whatsapp`), and `SMS` (chat message).
    - Ensures no label wrapping ("Statement" and "WhatsApp" stay on a single line).
- **Edit Transaction Delete Action**:
  - Refactor the delete button in `apps/app/components/EditTransactionModal.tsx` into a well-proportioned, accessible destructive button (or top-bar action with confirmation) with horizontal alignment (`flex-row`, `items-center`, `justify-center`, `gap-2`), a subtle red border/tint, and consistent padding.
- **Feature Flags for Sample Data & Account Deletion**:
  - Register `sample_data` and `account_deletion` in the feature flags registry (`apps/api/src/lib/feature-flags.ts`, DB schema/seed, docs).
  - Gate the "Sample data" card in `apps/app/app/(tabs)/profile.tsx` behind `isEnabled("sample_data")`.
  - Gate the "Delete account" card in `apps/app/app/(tabs)/profile.tsx` behind `isEnabled("account_deletion")`.
  - Default these flags to `false` in production so these features are safely hidden from standard users.

## Capabilities

### Modified Capabilities
- `mobile-shop-ui`: Update bottom tab bar styling to prevent clipping on Android devices; modernize customer detail action buttons into a two-row hierarchy preventing label truncation; polish edit transaction delete button placement and layout; prevent white flashing during screen loading and transitions.
- `feature-flags`: Add `sample_data` and `account_deletion` to the feature flag registry, gating sample data generation/cleanup and user account deletion across mobile profile and settings.

## Impact

- **Mobile App (`apps/app`)**:
  - `app/(tabs)/_layout.tsx`: Tab bar styling.
  - `app/_layout.tsx`: Root background color and Stack `contentStyle`.
  - `app/customers/details.tsx`: Loader background and actions layout.
  - `components/EditTransactionModal.tsx`: Delete button layout and styling.
  - `app/(tabs)/profile.tsx`: Guard Sample Data and Delete Account sections with `useFeatureFlags()`.
- **API (`apps/api`)**:
  - `src/lib/feature-flags.ts`: Add `sample_data` and `account_deletion` keys to the known flags registry and seed scripts.
- **Documentation**:
  - `docs/feature-flags.md`: Document new flag keys.
