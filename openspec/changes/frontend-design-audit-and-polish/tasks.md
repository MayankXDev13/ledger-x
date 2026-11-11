# Tasks

## 1. Authentication & Brand Experience

- [x] 1.1 Refactor `BrandPanel.tsx` in `apps/web/components/login/BrandPanel.tsx` to replace tech-SaaS boilerplate ("Finance Intelligence Platform", "0ms Latency", "100% Uptime", animated blur blobs) with authentic shopkeeper messaging ("Daily khata for small shops", "Built for the counter, not the boardroom"), and verify the sign-in page renders cleanly without console errors or layout shift.
- [x] 1.2 Remove single-word headline color accents and marketing boilerplate across sign-in views, and verify typography renders with authentic, dignified tone.

## 2. Customer Cards & Balance Parity

- [x] 2.1 Update `apps/web/app/(app)/customers/page.tsx` and `CustomerGrid.tsx` to fetch and pass collection balance and aging data to `CustomerCard`.
- [x] 2.2 Redesign `CustomerCard.tsx` to display outstanding balance in tabular numerals alongside an aging indicator or settled state, removing redundant chevron decoration and generic card hover lifts, and verify clean presentation across mobile (360px) and desktop viewports.

## 3. Typography, Hierarchy & Polish

- [x] 3.1 Update `TransactionItem.tsx` badge containers from rigid `h-4` to `min-h-[20px] px-2 py-0.5 leading-none` to prevent vertical text clipping, and verify unclipped rendering across credit, payment, and debit badges.
- [x] 3.2 Refactor `dashboard/page.tsx` greeting to eliminate single-word accent coloring and emoji clutter, ensuring clean, restrained shopkeeper-centric typography.
- [x] 3.3 Streamline `CustomerAnalyticsCards.tsx` to eliminate redundant card-hover drop-shadow bloat and keep customer ledger transactions visible without excessive scrolling.

## 4. Verification & Token Compliance

- [x] 4.1 Run `bun run check:visual` and verify all token definitions, contrast floors, and visual rules pass with zero errors.
- [x] 4.2 Run `bun run typecheck` across all packages to verify TypeScript compilation succeeds cleanly.
