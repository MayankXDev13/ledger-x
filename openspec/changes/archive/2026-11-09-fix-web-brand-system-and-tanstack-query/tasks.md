# Tasks

## 1. Web token realignment

- [x] 1.1 Retoken `apps/web/app/globals.css` primaries to orange ramp (`#EA580C`/`#C2410C`/`#FB923C`) for light+dark and verify login + sidebar active states render orange, not green
- [x] 1.2 Fix `bg-gradient-brand`/`text-gradient-primary`/`glow-primary` to defined `--brand` vars, strip `slate-*` from `BrandPanel`, and verify no missing-var gradient in DevTools
- [x] 1.3 Lock radius scale and card/border tokens (`#171717`/`#262626` dark) and verify dashboard cards share one radius and border color

## 2. Dashboard ledger identity

- [x] 2.1 Collapse `MetricCard` accents to brand/positive/danger only and verify Total Balance / Customers / Monthly Net use no cyan/violet/amber
- [x] 2.2 Recolor Area/Bar/trend charts to `#34D399` credit / `#E11D48` debit and verify flow, by-type, 12-month trend legends match
- [x] 2.3 Switch money to `JetBrains_Mono tabular-nums`, replace `react-icons/fa` with Lucide in `AppSidebar`, and verify amounts align and icons share one weight
- [x] 2.4 Promote aging `0-30/31-60/60+` as dashboard signature and verify buckets visible with oldest-highlight on seeded data

## 3. TanStack Query standardization

- [x] 3.1 Centralize `QueryClient` defaults (`staleTime/gcTime/retry`, focus/poll policy) in `QueryProvider` and verify hooks inherit them
- [x] 3.2 Add per-domain key factories (customers, dashboard, transactions, collection, settings) and verify list/detail/filter keys are stable and hierarchical
- [x] 3.3 Wire mutations to invalidate domain keys and surface envelope `error`+`details` via toast/inline, and verify create/update flows refresh without reload and show server message
- [x] 3.4 Remove inline `fetch` from components in favor of typed hooks and verify `grep -r "fetch(" apps/web/app apps/web/components` returns only lib/api

## 4. Integration verification

- [x] 4.1 Run `bun run build` (or `turbo run build --filter=web`) plus `bun run test` from root and verify green
- [x] 4.2 Contrast-check body/muted/primary text in both themes and verify normal text meets 4.5:1; update visual baselines
