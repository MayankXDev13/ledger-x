# Proposal

## Why

The UI/UX audit of the web and mobile clients found that the shipped product contradicts its own
design contract in ways a shopkeeper can feel: the web app declares brand colors it never defines, so
every primary call to action renders with **no background** (including the whole login and signup
brand panel); both clients invert the meaning of money colors — a received payment is painted **red**
on web and a credit given is painted **emerald** on mobile — so the one distinction a ledger exists to
make is unreadable; and the mobile Home tab still ships the pre-refresh "orange page with white
content cards" design, drawing its signature aging strip on orange at 0.75:1–1.32:1 contrast, where
it is invisible. The design system of record and the audit now exist as repository artifacts; this
change turns them into shipped, verifiable behavior on both clients.

## What Changes

- **The web brand layer exists and resolves.** Declare `--brand`, `--brand-light`, `--brand-fill` and
  `--color-brand`; point `--primary` at the brand orange so it matches the mobile contract; add a
  separate `--positive` emerald reserved for money received.
- **The web light theme is repaired.** `--background` and `--foreground` are declared for `:root`,
  not only inside `.dark`, so `bg-background` / `text-foreground` resolve in both themes.
- **Undefined custom utilities are defined or removed.** `.tabular` becomes the real `tabular-nums`;
  `.chip-receivable` / `.chip-payable` / `.chip-settled` stop rendering balance pills as bare text;
  `.card-hover`, `.fade-up` and `.safe-area-bottom` either exist or lose their usages.
- **Money semantics are corrected on both clients.** Credit given is neutral ink, a payment received
  is emerald, overdue is rose, and an outstanding balance stays neutral until 60+ days. The web
  dashboard chart series, legends and tooltips follow the same rule and preserve the sign.
- **Mobile Home is re-based on the dark contract.** Neutral-950 background, neutral-900 surfaces, no
  white content cards, one hero figure, `brand-fill` behind white labels on orange, and one aging
  color map shared by the strip and its legend.
- **Mobile literal colors are purged.** `#3B82F6` / `bg-blue-500` on primary Save buttons and
  stray `#10B981` / `#F59E0B` are replaced by brand and role tokens, and `lib/theme.ts` becomes the
  single runtime source instead of ~380 scattered hex values.
- **Accessibility reaches a usable baseline on both clients.** Every icon-only control has an
  accessible name, every pressable has a role and state, async status is announced through live
  regions, touch targets are at least 44pt, focus is always visible, and charts carry a name plus a
  text or table fallback.
- **Web forms become honest.** The submit button stays enabled and validation runs on blur so field
  errors can actually be shown; errors sit next to their field and are announced; every submission
  shows loading → success → error; API failures surface inline instead of as an unhandled rejection.
- **Data states stop lying.** A failed request no longer renders as "No customers yet" or "Every
  customer is settled"; route-level error and loading boundaries exist; mobile screens render an
  error state instead of `console.error`.
- **Mobile state is shared.** One session, settings and offline-queue controller replace the current
  five, three and three instances, so a queued write is replayed once and appears once.
- **The design system of record and the audit are published** as `design-system/ledger-x/` and
  `docs/ui-ux-audit.md`.
- **BREAKING (visual only, no data or API migration):** the web accent color changes from green to
  brand orange across every surface, and the web minimum text size rises from 9–11px to 12px.

## Capabilities

### New Capabilities

- `web-visual-system`: defines the Ledger-X web client's visual and interaction contract — brand and
  semantic color roles, tokens that resolve in both themes, typography and money numerals, chart
  integrity and fallback, reachable and named actions, honest form and data states, small-screen
  layout and safe areas, and predictable navigation.

### Modified Capabilities

- `mobile-visual-system`: tightens the existing mobile contract so the shipped app actually matches
  it — one aging color map shared by strip and legend, emerald reserved for money received, tabular
  numerals on every amount renderer rather than only `MoneyText`, accessible roles, labels and live
  regions on every control, pressed feedback on every pressable, and one shared session/queue state
  so the screens show what actually happened.

## Impact

- **Affected code — web:** `apps/web/app/globals.css` (brand ramp, theme tokens, missing utilities,
  radius scale), `apps/web/app/layout.tsx` (drop the two unused font loads), `apps/web/app/(app)/**`
  (dashboard, customers, customer detail, statement, collection, settings, app layout),
  `apps/web/components/**` (transactions, customers, layout, providers, onboarding, auth screens),
  and new `error.tsx` / `loading.tsx` / `not-found.tsx` route boundaries under `app/(app)/`.
- **Affected code — mobile:** `apps/app/app/(tabs)/home.tsx`, `apps/app/app/customers/**`,
  `apps/app/app/ledger/add.tsx`, `apps/app/components/**` (`AgingStrip`, `Button`, `MoneyText`,
  `QuickEntryModal`, `EditTransactionModal`, `OnboardingDialog`, `AppLockGate`, `OfflinePendingBar`),
  `apps/app/lib/theme.ts`, and `apps/app/hooks/useAuth.ts`, `useOfflineQueue.ts`, `useSettings.ts`.
- **Docs:** `design-system/ledger-x/MASTER.md`, `design-system/ledger-x/pages/*.md`,
  `docs/ui-ux-audit.md`, and the README documentation index.
- **No API, database, schema, auth-flow, or offline-queue format changes.** No new dependencies and
  no new fonts: Source Sans 3 and JetBrains Mono are already loaded on web, Mukta and IBM Plex Mono
  already ship on mobile.
- **Risk:** the web re-theme is visible on every surface and the contrast repairs change how money
  reads, so screenshot verification of both clients is the acceptance gate — the same gate the
  in-flight `refine-mobile-ux-and-visual-system` change left unchecked as task 8.6.
- **Sequencing:** the in-flight `refine-mobile-ux-and-visual-system` change is 36/37 tasks complete
  while the audited code still violates several of its completed tasks (Home surfaces, contrast
  sweep, pressed states). This change re-verifies and completes those areas rather than assuming the
  earlier task checkmarks are accurate, and it does not archive that change.
