# Proposal

## Why

The web app (`apps/web`) ships a different visual identity from the mobile reference (`apps/app/tailwind.config.js`): green oklch primary instead of orange `#EA580C`, undefined `bg-gradient-brand` vars, rainbow metric/chart colors instead of positive/danger semantics, and mixed icon/type systems. TanStack Query is already adopted (`QueryProvider`, `useDashboard`, `useCustomers`) but without documented conventions, so invalidation, key factory, and stale-time behavior vary per hook.

## What Changes

- Retoken web `globals.css` to the mobile reference palette: bg `#0A0A0A`, surface `#171717`, line `#262626`, ink `#FAFAFA`/`#A3A3A3`, brand `#EA580C`/`#C2410C`/`#FB923C`, positive `#34D399`, danger `#E11D48`.
- Fix/replace `glow-primary`, `text-gradient-primary`, `bg-gradient-brand` utilities that reference undefined `--brand` vars; remove `slate-*` surfaces from `BrandPanel`.
- Collapse dashboard `MetricCard` accent map (cyan/emerald/violet/amber) and hardcoded chart fills (`#DC2626`, `#22C55E`, `#EF4444`) to brand + positive/danger only.
- Standardize money typography to mono tabular-nums and single icon library (Lucide), single radius scale.
- Document and enforce TanStack Query conventions: key factories, `staleTime`/`refetchInterval` defaults, mutation invalidation, error-envelope surfacing; no ad-hoc `fetch` in components.
- Elevate receivables aging (`0-30 / 31-60 / 60+`) as the web signature element.

## Capabilities

### New Capabilities
- `web-visual-system`: web color, type, layout, and icon rules mirroring the mobile reference so web and mobile read as one product.
- `web-data-fetching`: TanStack Query usage contract for the web app (key shape, caching, invalidation, error mapping).

### Modified Capabilities
- `web-api-integration`: extend client-side requirement to mandate TanStack Query conventions and error-envelope consumption (currently only requires reading `error` string and `NEXT_PUBLIC_API_URL`).

## Impact

- Affected: `apps/web/app/globals.css`, `apps/web/app/layout.tsx`, `apps/web/components/login/BrandPanel.tsx`, `apps/web/components/AppSidebar.tsx`, `apps/web/app/(app)/dashboard/page.tsx`, `apps/web/hooks/*`, `apps/web/components/providers/QueryProvider.tsx`, `apps/web/lib/api*`.
- No API contract break; visual change is **BREAKING** for screenshots/snapshot tests only.
- Dependencies: `@tanstack/react-query` already present; no new deps expected.
