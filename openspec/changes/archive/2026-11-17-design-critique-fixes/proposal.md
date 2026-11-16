# Proposal

## Why

A fresh design critique of the shipped web app at 1440px and 360px found that the desktop experience
is coherent but the phone experience hides the shopkeeper's actual job. On `/dashboard` at 360px the
first viewport is a greeting, an "Add Customer" button and three full-width stat cards, so the money
list and any way to record a credit or payment sit below the fold, and the single primary action is
the wrong one. Customer detail offers two competing "Add" buttons and paints an outstanding balance
in the brand action colour, teaching the user that orange means money owed. The same outstanding
figure is named "Total balance" on Dashboard and "Total receivables" on Collection, and the mobile
nav says "Collect" while the sidebar says "Collection". Login claims "1-Tap UPI collection" while
Settings states payments are recorded manually. These are hierarchy, language and accessibility
defects, not missing features, and each has a small, specific fix.

## What Changes

- **Mobile dashboard leads with the money.** A single "Total outstanding" hero, one primary
  "Record payment" action with "Give credit" secondary, and the remaining figures collapsed into a
  compact stat row. "Add Customer" moves out of the primary slot.
- **One primary action per view.** The duplicate in-card "Add" on customer detail is demoted or
  removed; the sticky action bar remains the single primary.
- **Outstanding balances use neutral ink.** Brand orange is reserved for identity and actions; the
  balance goes rose only at 60+ days, with text always carrying the direction.
- **One name for each thing.** "Total outstanding" everywhere the ledger total appears, one nav
  label for collection, and the full "Oldest unpaid N days" phrase on cards and rows.
- **Collection gets to the point.** The UPI detail is compacted so the first debtor row appears in
  the initial phone viewport, and the aging label never wraps into its action buttons.
- **Phone layout stops cramping.** The customer-detail stat block and customer cards give names and
  numbers enough room at 360px; names are the primary identifier and must not be cut to a few letters.
- **Login copy tells the truth.** Honest benefit labels replace vanity metrics and the "1-Tap" claim,
  small labels meet contrast, and the page has one `<h1>`.
- **Small interaction polish.** The statement filter controls share one row, the collection sort uses
  underline tabs, and the generated timestamp does not wrap awkwardly.
- **The design system and audit report stay in sync** with the shipped behaviour.

## Capabilities

### Modified Capabilities

- `web-visual-system`: adds requirements for mobile-first money hierarchy, one primary action per
  view, neutral outstanding balances, consistent money and navigation language, compact collection
  framing, legible small-screen density, honest login copy, and predictable filter layout.

## Impact

- **Affected code:** `apps/web/app/(app)/dashboard/page.tsx`, `apps/web/app/(app)/customers/page.tsx`,
  `apps/web/components/customers/CustomerCard.tsx`, `apps/web/components/customers/CustomerDetailView.tsx`,
  `apps/web/app/(app)/collection/page.tsx`, `apps/web/components/MobileBottomNav.tsx`,
  `apps/web/components/login/BrandPanel.tsx`, `apps/web/components/customers/StatementView.tsx`,
  `design-system/ledger-x/MASTER.md`, `design-system/ledger-x/pages/*.md`.
- **No API or data migration.** All changes are presentational and label-level; balances, ages and
  routes keep their current contracts.
- **Verification:** `bun run check:visual`, `bun run lint`, `bun run typecheck`, `bun run test`,
  a production build, and a fresh 360px/1440px screenshot matrix reviewed against the acceptance
  criteria below.

## Out of scope

- The native Expo app (no device was available to capture it in this review).
- Changing how payments are actually recorded or adding automatic UPI reconciliation.
- Reordering or renaming routes beyond the "Collect" / "Collection" label decision.
