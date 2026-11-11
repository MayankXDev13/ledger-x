# Web — Dashboard (`/dashboard`)

> Overrides `design-system/ledger-x/MASTER.md` for `apps/web/app/(app)/dashboard/page.tsx`.

## 1. Page shape

```
[ page title · greeting (first name)         ]
[ 4 stat tiles in a row, hairline separated  ]
[ 2 chart cards          ] [ chart card      ]
[ 12-month trend (2/3)   ] [ top debtors     ]
[                         ] [ aging summary   ]
```

- One hero: the "total outstanding" figure. Everything else is a tile or a chart card.
- The dashboard is currently `"use client"` at the page root and bundles recharts eagerly.
  Move the charts into a `next/dynamic` island (`{ ssr: false }`) and keep the page a server
  component that renders the data shell.
- `hooks/useDashboard.ts` polls three queries every 30 s with no visibility gating and no
  `isFetching` feedback. Gate on `document.visibilityState` and surface a subtle refresh state.

## 2. Stat tiles

- Amounts: `tabular-nums`, `Intl.NumberFormat("en-IN")`, never `text-[10px]`.
- No `text-[9px]`/`text-[10px]`/`text-[11px]` — the web floor is 12px.
- A failed metrics request currently renders a permanent "—". Render an error state with a retry
  instead, or keep the last good value and mark it stale.

## 3. Charts — mandatory rules

| Rule | Detail |
|---|---|
| Series colours | Credit given = neutral/ink or a muted warm tone. Paid = `--positive` emerald. **Never red for money that arrived.** Today: Credit `#22C55E`, Paid `#EF4444`, flow `#DC2626` — all three are wrong. |
| Never colour-only | Add a visible legend with **text** for every chart, and differentiate the two series by fill pattern or direct label as well as hue. "By Type" currently has no legend at all. |
| Theme-aware grid | `stroke="rgba(255,255,255,0.04)"` is invisible on a white card. Use `var(--border)`. |
| Use the tokens | `--chart-1…5` exist but are five near-identical purples and are identical in both themes. Redefine them as a real, distinct, theme-aware series ramp and reference them instead of literals. |
| Accessible name | Wrap each chart in `role="img"` with an `aria-label`, or use the shipped `components/ui/chart.tsx` wrapper (currently unused) which supports `ChartConfig` theming. |
| Data fallback | Every chart needs a one-line trend summary and/or a small data table beneath it. |
| Sign fidelity | `formatCurrency(Math.abs(payload[0].value))` drops the sign, so a ₹500 credit and a ₹500 debit both read "₹500". Keep the sign. |
| Axis labels | The area chart's Y formatter lacks `Math.abs` while the bar chart's has it — negative values render as `₹-5k`. Pick one convention. |
| Layout | `margin.left: 0` with `YAxis width: 50` leaves no room for the labels. Use `left: 8` and let the axis keep its width. |

## 4. Known defects in this page

- `dashboard/page.tsx:147,583,718` — `tabular` (invalid class) instead of `tabular-nums`.
- `dashboard/page.tsx:44` — `Legend` imported from recharts but never rendered.
- `dashboard/page.tsx:175,188` — tooltip payload typed `any`.
- `dashboard/page.tsx:213,678` — the full customer list is downloaded to label 5 rows;
  fetch names with the transactions instead.
- `dashboard/page.tsx:210,254` — the Refresh button refetches 1 of 3 queries.
- `dashboard/page.tsx:115,229` — `.fade-up` / `.card-hover` are not defined; either define them
  or drop them.
