# Design

## Context

See `proposal.md` for motivation and background. Ledger-X is built as a monorepo containing `apps/web` (Next.js 16 + Tailwind v4 + Radix) and `apps/app` (Expo 58 + React Native + NativeWind). While `apps/app` and `design-system/ledger-x/MASTER.md` emphasize high-density, authentic shopkeeper-centric interfaces ("Daily khata for small shops", "Built for the counter, not the boardroom"), parts of `apps/web` had accumulated generic AI-template boilerplate (such as "Finance Intelligence Platform", "0ms Latency", animated background blurs, single-word headline color highlights, and generic SaaS card-hover kits). In addition, web customer list cards only showed name and phone number, omitting the primary data point shopkeepers care about: customer balance and aging status.

## Goals / Non-Goals

**Goals:**
- Eliminate AI-generated template chrome, fake metrics ("∞ Transactions", "0ms Latency"), and single-word headline accents across web auth and dashboard pages.
- Bring the web `CustomerCard` and grid into functional parity with the mobile app by surfacing outstanding balance, aging indicators, and settled badges using tabular numerals.
- Resolve clipped badge typography in `TransactionItem` caused by rigid `h-4` constraints.
- Streamline `CustomerDetailView` customer stats to preserve screen hierarchy and keep the ledger feed visible above the fold.
- Maintain full compatibility with all visual design tokens, contrast floors, and test scripts (`bun run check:visual`).

**Non-Goals:**
- Modifying backend schemas, database tables, or API contracts.
- Introducing new color hues (preserving orange as the sole chromatic brand hue and emerald strictly for money received).
- Refactoring mobile app screens that already follow the authentic khata design principles.

## Decisions

### Decision 1: Ground BrandPanel and Sign-in in Domain Reality
- **Choice**: Harmonize `apps/web/components/login/BrandPanel.tsx` with mobile's `apps/app/app/auth/login.tsx`.
- **Details**:
  - Replace "Finance Intelligence Platform" with "Daily khata for small shops".
  - Replace "Track every <span className='text-brand-soft'>transaction.</span>" with clean headline typography: "Know who owes you, record entries, and collect faster."
  - Remove fake metrics ("∞ Transactions", "0ms Latency", "100% Uptime") and remove animated blurred circles (`blur-3xl animate-pulse`).
  - Add the grounded sign-off: "Built for the counter, not the boardroom".
- **Alternatives Considered**: Keeping a SaaS landing pitch was rejected because it reads as disconnected AI boilerplate for a kirana ledger.

### Decision 2: Surface Outstanding Balance & Aging on Web Customer Cards
- **Choice**: Integrate customer balance mapping into `apps/web/app/(app)/customers/page.tsx` and `CustomerCard.tsx`.
- **Details**:
  - Fetch collection totals using the existing `useCollection("amount")` hook.
  - Map each customer to their `outstanding` balance and `ageDays`.
  - In `CustomerCard.tsx`, render the balance using `tabular-nums` and a clear badge: either the formatted balance with aging tone (neutral for <=30d, rose for >30d/60d) or a subtle "Settled" indicator when balance is 0.
  - Remove redundant trailing `ChevronRight` and excessive hover glow to respect fixed ledger rhythm.
- **Alternatives Considered**: Leaving customer cards without balances and requiring shopkeepers to click each customer was rejected because the ledger's primary purpose is tracking receivables.

### Decision 3: Fix Clipped Badge Heights & Remove Heading Single-Word Accents
- **Choice**: Adjust transaction badge styling and remove single-word color spans in headings.
- **Details**:
  - In `TransactionItem.tsx`, update type badge container from `h-4` to `min-h-[20px] px-2 py-0.5 leading-none` to guarantee 12px text with uppercase tracking never clips vertically.
  - In `dashboard/page.tsx`, remove single-word accent `<span className="text-primary capitalize">{firstName}</span> 👋` in favor of a clean, restrained headline without emoji clutter.
  - In `CustomerAnalyticsCards.tsx`, consolidate metric presentation and remove repetitive `card-hover` scale and hover-glow effects.

## Risks / Trade-offs

- **[Risk] Customer collection data loading delay** → Mitigation: `useCollection` data is cached via TanStack Query; if collection data is loading, `CustomerCard` gracefully renders a neutral placeholder or omits the badge until loaded without shifting layout.
- **[Risk] Token script violations** → Mitigation: Every color and surface change uses existing declared CSS tokens (`--foreground`, `--muted-foreground`, `--brand`, `--positive`, `--destructive`) and is validated against `bun run check:visual`.
