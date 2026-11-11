# Design: Mobile UI Polish, Screen Transitions, and Feature Flags

## Context

Testing on a connected physical Android device (`adb`) identified five usability and visual defects:
1. React Navigation tab bar was rendered without safe area insets on Android, resulting in a 39px height where tab labels and icons were clipped beneath the system navigation bar.
2. When transitioning between screens (such as opening a customer detail from the customer list), a white flash was visible for ~500ms because root layouts, Stack `contentStyle`, and loading spinners lacked `backgroundColor: colors.bg`.
3. The customer detail screen crammed five action buttons into a single row, forcing text labels into awkward line breaks ("Stateme\nnt" and "WhatsA\npp").
4. In `EditTransactionModal`, the delete action was rendered as an unstyled vertical stack of icon and text on the left margin.
5. "Load sample data" and "Delete account" were permanently visible in the Profile tab; the user requested these features be stopped/hidden behind feature flags.

## Goals / Non-Goals

**Goals:**
- Eliminate bottom tab bar clipping across all Android navigation modes (gesture pill and 3-button).
- Ensure all screen transitions, stack containers, and loader fallbacks render cleanly in dark mode (`#121212`) without white flashes.
- Redesign customer detail action buttons into a two-row hierarchy where primary ledger actions and communication tools are separated and labels never wrap.
- Redesign the transaction deletion trigger in `EditTransactionModal` into an intentional, accessible destructive button.
- Introduce `sample_data` and `account_deletion` feature flags to cleanly hide these capabilities from the UI and guard corresponding API routes.

**Non-Goals:**
- Modifying offline queue transaction syncing or accounting calculation logic.
- Altering existing customer statement PDF generation logic.

## Decisions

### 1. Tab Bar Safe-Area Insets Calculation
- **Choice**: In `apps/app/app/(tabs)/_layout.tsx`, compute `const bottomPadding = Math.max(insets.bottom, 12);` and apply `tabBarStyle: { height: 60 + bottomPadding, paddingBottom: bottomPadding, paddingTop: 8, backgroundColor: colors.bg }`.
- **Rationale**: Android navigation bars report varying bottom insets (0 on some versions/modes, 16-24 on gesture, 48 on 3-button). Using `Math.max(insets.bottom, 12)` guarantees comfortable spacing regardless of system navigation mode.
- **Alternatives considered**: Relying on default React Navigation automatic sizing. (Failed in practice: resulted in 39px height with clipped icons).

### 2. Transition Dark Background
- **Choice**:
  - Add `backgroundColor: colors.bg` to root `SafeAreaView` in `apps/app/app/_layout.tsx`.
  - Add `contentStyle: { backgroundColor: colors.bg }` to `<Stack screenOptions={{ ... }}>`.
  - Add `backgroundColor: colors.bg` to `styles.loader` in `apps/app/app/customers/details.tsx`.
- **Rationale**: React Navigation renders the native container background during route transitions and component mounts. By default this background is white (`#ffffff`). Explicitly specifying `colors.bg` ensures seamless dark transitions.

### 3. Customer Detail Action Hierarchy
- **Choice**: Divide actions into two distinct horizontal groups:
  - **Primary Row**: `+ Credit` (orange brand) and `- Payment` (emerald positive), height 48px, side-by-side.
  - **Secondary Row**: Three equal utility buttons: `Statement`, `WhatsApp` (styled with official WhatsApp green `#25D366` / emerald accent), and `SMS`, height 42px.
- **Rationale**: Grouping by semantic purpose clarifies the workflow for shopkeepers and provides ample width (>100dp per button) so labels never wrap.

### 4. Edit Transaction Delete Action
- **Choice**: Render a full-width destructive action pill at the bottom of the modal form:
  - Border and background using `danger` token (`border-danger/30`, `bg-danger/10`).
  - Centered row layout with trash icon beside "Delete Transaction".
  - Retains the existing two-step confirmation modal before deleting.
- **Rationale**: An intentional full-width button aligns with the design system's form grammar and avoids mis-taps while feeling purposeful rather than orphaned.

### 5. Gating Sample Data and Delete Account with Feature Flags
- **Choice**:
  - Add `sample_data` and `account_deletion` keys to `KNOWN_FLAGS` in `apps/api/src/lib/feature-flags.ts`.
  - In `apps/app/app/(tabs)/profile.tsx`, check `isEnabled("sample_data")` and `isEnabled("account_deletion")` before rendering their respective sections.
  - In `apps/api/src/routes/sample-data.ts` and `apps/api/src/routes/account.ts`, guard endpoints with `isEnabled(db, "sample_data")` and `isEnabled(db, "account_deletion")`.
- **Rationale**: Both mobile and API enforce the disabled state. Unknown or unset flags resolve to disabled (`false`), keeping sensitive actions hidden from standard users until an administrator flips them on.

## Risks / Trade-offs

- **[Risk] Safe area insets may vary on notched or curved Android screens** → Mitigation: Clamped minimum padding (`Math.max(insets.bottom, 12)`) prevents bottom edge collision even when OS returns 0 inset.
- **[Risk] User who previously loaded sample data needs to clear it** → Mitigation: Feature flag can be enabled via CLI `bun run db:feature-flag --key sample_data --enable true` whenever needed.
