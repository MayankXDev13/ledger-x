# Proposal

## Why

The mobile app now follows the approved dark five-screen mock at a layout level, but the system behind the screens is ad hoc: there is no type scale or custom font, roughly six hardcoded grey values and three different oranges, white cards compete with the primary action, money semantics contradict each other (debt is green, payment is red), and several controls look tappable but do nothing. A shopkeeper cannot reliably tell what is actionable, what a color means, or where the money stands — and the product has no visual identity that is not "dark app with an accent color".

This change defines one deliberate system for the five tabs and the launch screen: **orange-600 as the brand/action color, Tailwind neutral as the secondary, rose-600 for risk and overdue, emerald for money received**. Blue was considered and rejected because it is the default hue of the Indian khata category and would make Ledger-X look like every competitor; purple was rejected because a third chromatic brand color would dilute the value of orange and rose in exactly the way blue diluted it.

## What Changes

- **Color roles, not scattered hex values**: orange-600 (`#EA580C`) for brand and primary actions, orange-700 (`#C2410C`) for white-text fills to meet contrast, Tailwind neutral for surfaces/text/borders, rose-600 (`#E11D48`) for overdue and destructive, emerald for received payments. No blue and no purple in the brand system.
- **Typography**: adopt Mukta (Latin + Devanagari) for UI and headings, IBM Plex Mono for ledger labels and dates, tabular numerals for all money, and a fixed six-step type scale. Remove the ad-hoc 8/11/15/17px sizes and the all-extrabold hierarchy.
- **Surface and layout rules**: neutral-900 cards with 1px neutral-800 hairlines, no white cards, one hero number per screen, 20px gutter, 44px minimum touch targets. Home moves from a 2x2 white metric grid to a ledger header with total outstanding as the hero.
- **Screen composition**: Home hero + three inline stats + actions + trend + top debtors; Ledger day grouping, signed amounts, and an explicit recent-activity scope; Collection QR as the focal point without the white Quick Actions card; Customers always shows phone and balance; Profile separates identity, settings, and destructive actions with a single logout.
- **Signature element**: one aging visual language for 0–30 / 31–60 / 60+ day money. Home shows a proportional strip built from the aggregate aging buckets the API already returns; customer rows show a three-segment indicator with the oldest unpaid bucket highlighted. It turns existing FIFO aging data into the product's memorable visual without inventing per-customer bucket amounts.
- **Honest affordances**: every control either performs its stated action or is removed. This includes dead search/filter/bell icons, the non-functional Download/Print QR rows, the unreachable Collection sort state, placeholder Profile menu rows, and the duplicate logout.
- **Accessibility**: WCAG AA contrast for text and controls, minimum 44x44 targets, color-independent money encoding (signs and labels), and screen-reader labels for avatars and icon-only buttons.
- **Launch screen alignment**: the first screen (`app/index.tsx`) moves from green to the same orange/neutral system so the brand is consistent before the tabs load.
- **BREAKING (UX-visible, no data migration)**: the Home 2x2 white metric cards and the white Collection Quick Actions card are removed; QR download/print claims are replaced by behavior that actually produces a file/share target or are removed.

## Capabilities

### New Capabilities

- `mobile-visual-system`: defines the Ledger-X mobile visual and interaction contract — color tokens and semantic money roles, typography and numerals, surface and layout primitives, per-screen composition rules, component states and press feedback, the aging-strip signature, accessibility requirements, and the requirement that visible controls perform their stated action.

### Modified Capabilities

- None. The in-progress change `mobile-five-screen-ui-refresh` introduces `mobile-shop-ui` only as a change delta (it is not yet in `openspec/specs/`). Its visual and composition clauses (2x2 white metric cards, white Quick Actions card, orange-only palette, cross-color money semantics) conflict with this change. `mobile-shop-ui` should be reconciled with the `mobile-visual-system` capability before that change is archived; this proposal deliberately does not silently rewrite an in-flight change.

## Impact

- Affected code: `apps/app/tailwind.config.js` (tokens), `apps/app/app/(tabs)/*` (five screens and tab shell), `apps/app/components/*` (avatars, offline bar, quick entry, shared primitives), `apps/app/app/index.tsx` (launch screen), `apps/app/app.json` (theme/fonts), and font loading in the root layout.
- No API, database, authentication, or offline-queue behavior changes. The dashboard's recent-transactions endpoint returns only five entries, so this change labels Ledger as recent activity; a full-history ledger with per-row running balance is deferred to a separate change that adds pagination.
- The web app (`apps/web`) keeps its emerald primary in this change; aligning web to the same brand tokens is a follow-up so this change stays reviewable on mobile.
- Risk: the orange surname is close to the current build, so the improvement depends on typography, hierarchy, and affordance fixes rather than a new hue; skipping those would leave the app looking unchanged.
