# Design

## Context

See proposal.md Why. Current: `apps/web/app/globals.css` uses shadcn `taupe` oklch greens (`--primary` hue 150), `--radius: 0`, undefined `--brand` vars; `BrandPanel`, `AppSidebar`, dashboard hardcode slate/violet/cyan fills. Data layer already on `@tanstack/react-query` (`QueryProvider`, `dashboardKeys`, `customerKeys`) but defaults (`staleTime 60s`, `retry 1`, `refetchInterval 30s` on dashboard) and invalidation patterns are undocumented and inconsistent.

## Goals / Non-Goals

**Goals:**
- One token source matching `apps/app/tailwind.config.js` for web light+dark.
- Dashboard reads as ledger (hero net + aging), not 4-chart SaaS grid.
- Every server read/write flows through typed TanStack hooks.

**Non-Goals:**
- No API route changes; no new deps; no mobile changes; no auth-flow redesign.

## Decisions

1. **Retoken in CSS vars, not Tailwind config** — web uses Tailwind v4 `@theme inline`. Map `--primary/--accent/--sidebar-primary` to orange ramp `#EA580C`/`#C2410C`/`#FB923C`, `--chart-1..5` to brand/positive/danger only. Alt (new tailwind.config) rejected: v4 theme is CSS-first.
2. **Fix gradient utilities to real vars** — define `--brand: #EA580C; --brand-fill: #C2410C` and rewrite `bg-gradient-brand`/`text-gradient-primary` to use them; strip `slate-*` from BrandPanel. Alt (delete gradients) rejected: brand needs one memorable gradient moment on login.
3. **Semantic-only chart palette** — Area/Bar fills become `positive #34D399` (credit) / `danger #E11D48` (debit), grid `rgba(255,255,255,0.04)` kept. MetricCard accent map collapses to `brand | positive | danger`. Alt (keep multicolor) rejected: violates mobile-visual-system rule.
4. **Lucide-only + mono money** — replace `react-icons/fa` in `AppSidebar` with Lucide equivalents; money class `font-mono tabular-nums` via existing `JetBrains_Mono` var. Alt (add Mukta/Plex) rejected: avoid font churn; JetBrains Mono already loaded.
5. **Codify Query conventions** — keep single `QueryClient`; document `staleTime 60s`, `gcTime 5m`, `retry 1`, no window-focus refetch except dashboard `30s` poll; key factories `["customers"...] / ["dashboard"...]`; mutations `onSuccess: invalidate domain + toast(envelope.error)`. Alt (React cache/fetch) rejected: breaks existing hooks.

## Risks / Trade-offs

- [Risk] Orange on white light-mode contrast → Mitigation: use `#C2410C` fill behind white text, `#EA580C` for accents only; verify 4.5:1.
- [Risk] Snapshot/chromatic churn from recolor → Mitigation: visual-only change; accept one-time baseline update.
- [Risk] Over-invalidation refetch storms → Mitigation: invalidate domain `all` only, not every filter combo; keep dashboard poll at 30s.
- [Risk] `radius: 0` vs `rounded-xl` drift → Mitigation: lock one scale (`--radius 0.75rem`, cards `rounded-xl`, pills `rounded-full`).

## Migration Plan

1. Land tokens + utilities (dark + light) behind no flag; verify login/dashboard/sidebar.
2. Land MetricCard/chart/icon/type cleanup.
3. Land Query convention doc + hook refactors (no behavior change).
4. Update baselines; rollback = revert change (no migration).

## Open Questions

- None blocking. Light-mode neutral ramp exact oklch values to be fixed during implementation against contrast check.
