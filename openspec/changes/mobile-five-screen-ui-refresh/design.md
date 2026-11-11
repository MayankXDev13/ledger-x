# Design

## Context

Current mobile tabs in `apps/app/app/(tabs)/` already fetch correct data (dashboard metrics/analytics, recent transactions, collection FIFO aging, customer list, settings/UPI) but use green `#10B981` primary, stacked `MetricCard` list, and divergent layouts. See proposal.md Why. Mockups require dark + orange system without backend changes; web app and API are untouched.

## Goals / Non-Goals

**Goals:**
- Match 5-screen mock layout/hierarchy using existing endpoints and navigation routes.
- Centralize orange accent + dark surfaces in theme tokens to avoid scattered hex edits.
- Keep offline queue, app-lock, exports, sample-data behaviors unchanged.

**Non-Goals:**
- No API/schema changes, no new analytics computation, no web UI changes.
- No new auth, notifications backend, or actual UPI payment verification (manual recording stays).
- No print SDK integration beyond OS share/print sheet.

## Decisions

- **Theme tokens over per-file hex**: extend NativeWind `brand-*` (e.g. `brand-primary: #FF6B00 / #F97316`, `brand-dark`, `brand-card`, `brand-border`) and map tab `tabBarActiveTintColor` to orange. Alternative: hardcode per screen — rejected (drift, hard to revert).
- **Reuse data hooks, restyle views only**: keep `dashboardApi`, `useCollection`, `customersApi`, `useSettings`, `buildUpiUri`, `QuickEntryModal`, `OfflinePendingBar`. Alternative: new screens from scratch — rejected (duplicates logic, risks offline/lock regressions).
- **Chart: custom lightweight bars/line with Views, not new chart lib**: current Home uses paired Views; extend to orange/green line-like trend to match mock without adding `victory`/`gifted-charts` weight. Alternative: add chart lib — deferred unless fidelity fails on device test.
- **Collection QR hero + modal reuse**: hero QR uses `react-native-qrcode-svg` value already built by `buildUpiUri`; Share/Download/Print go through `expo-sharing` + `Share` + clipboard, same as Profile exports. Alternative: `expo-print` PDF — only if Print QR user testing demands it.
- **Avatar pattern**: blue-circle initial (`#60A5FA`-style on dark) as pure presentational component `CustomerAvatar`; no backend avatar upload.
- **Tab order**: mock order Home, Ledger, Collection, Customers, Profile — requires reordering `app/(tabs)/_layout.tsx` (currently Home, Customers, Ledger, Collect, Profile) and renaming Collect label to Collection. Keep file routes identical to avoid deep-link breakage.

## Risks / Trade-offs

- [Risk] Orange-on-black contrast / accessibility → Mitigation: check WCAG AA for text buttons, keep white text on orange, preserve green/red semantics for amounts.
- [Risk] Quick Actions white card breaks dark mode consistency → Mitigation: scope white surface to that card only per mock; verify dark text/icons.
- [Risk] Reordering tabs confuses existing users → Mitigation: keep route names, only change display order/labels; no migration needed.
- [Risk] QR/print on low-end Android → Mitigation: fallback to copy-link + error toast; test with Expo Go + EAS preview build.

## Migration Plan

1. Land behind no flag (visual-only); visual QA on iOS + Android.
2. Rollback: revert tab files + theme tokens (single change, no data migration).
3. No deploy coordination with API/web required.

## Open Questions

- Notification bell (Home) and search/filter icons: wire to existing search vs placeholder? Defer to tasks (bell → no-op/toast for now, search → existing filter inputs).
- Exact orange hex (mock looks #FF6B00–#F97316): confirm from designer export during implementation.
