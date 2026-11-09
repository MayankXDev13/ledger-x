# web-visual-system Specification

## Purpose
Defines the web visual language so `apps/web` reads as the same product as the mobile reference: one orange brand, neutral-ink surfaces, and ledger-first money typography.

## Requirements

### Requirement: Web brand and semantic colors match mobile reference

The web app SHALL use `#EA580C` as the sole brand/primary color, `#C2410C` as the filled-button background, neutral `#0A0A0A`/`#171717`/`#262626` for bg/surface/line, `#FAFAFA`/`#A3A3A3` for ink, `#34D399` for inflow/credit, and `#E11D48` for outflow/danger. Violet, cyan, and blue SHALL NOT appear as brand accents.

#### Scenario: Primary action is orange
- **WHEN** the user views any primary button, active nav item, or avatar fallback
- **THEN** its accent is `#EA580C` or its tint, never green oklch(150) or violet

#### Scenario: No rainbow metric cards
- **WHEN** the user views the dashboard metric cards
- **THEN** at most brand orange plus positive/danger semantics color the cards

#### Scenario: Charts use semantic fills only
- **WHEN** the user views transaction flow, by-type, or 12-month trend charts
- **THEN** credit uses `#34D399` family and debit/paid uses `#E11D48` family

### Requirement: Web surfaces and contrast

Web content SHALL render on `#0A0A0A` background with `#171717` card surfaces and `#262626` borders in dark mode. Body text SHALL meet 4.5:1 contrast; `slate-*` washes SHALL NOT be used as card surfaces.

#### Scenario: Login brand panel is on-palette
- **WHEN** the user views `/login`
- **THEN** the brand panel uses brand gradient plus neutral surfaces, with no `slate-800/50` cards

#### Scenario: Gradient utilities resolve
- **WHEN** `bg-gradient-brand` or `text-gradient-primary` is used
- **THEN** it resolves to the `#EA580C -> #C2410C` ramp with no missing CSS var

### Requirement: Money typography and icon discipline

All monetary values SHALL use tabular numerals in a monospaced face. The web app SHALL use Lucide icons only and a single radius scale.

#### Scenario: Amounts align
- **WHEN** the user scans debtors, aging buckets, or transaction rows
- **THEN** amounts share one mono tabular style and decimal alignment

#### Scenario: Icons are consistent
- **WHEN** the user views sidebar and dashboard icons
- **THEN** every icon comes from Lucide with one stroke weight

### Requirement: Aging strip is the web signature

The web app SHALL present the `0-30 / 31-60 / 60+` receivables aging as its signature element on the dashboard, with proportional emphasis, reusing the mobile bucket semantics.

#### Scenario: Aging visible above fold
- **WHEN** the user with outstanding balances opens the dashboard
- **THEN** the three aging buckets are visible with values and the oldest-bucket highlight
