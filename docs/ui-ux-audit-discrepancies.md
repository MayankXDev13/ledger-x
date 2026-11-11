# Discrepancy list — `refine-mobile-ux-and-visual-system`

Audit date: 2026-11-10
Earlier change: `openspec/changes/refine-mobile-ux-and-visual-system` (36/37 tasks checked off)
Produced by: `audit-ui-ux-and-generate-artifacts`

## Why this exists

The earlier change is 36/37 tasks complete. Its only unchecked task is **8.6 — capture iOS and
Android screenshots of the launch screen and all five tabs** — the very verification that would
have caught the defects below.

So the question for the archive decision is not "is the earlier change done?" but "were its
completed tasks actually implemented?" This list answers that for every task the audit touched.

## Checked off, but the behavior was not present

| Earlier task | Claimed | Found in the code | Status now |
|---|---|---|---|
| **3.3** Replace the 2x2 white cards with one inline stat row and the primary/secondary actions | done | `app/(tabs)/home.tsx` painted the whole tab `bg-brand-primary` and stacked `bg-white` cards at `:218`, `:337`, `:432` | **fixed** by this change (task 5.1) — dark surfaces, no white cards |
| **3.2** Hero with the proportional aging strip and an "oldest unpaid" label | done | The hero and strip rendered, but on the brand orange: the three strip fills measured **0.75:1 / 1.32:1 / 0.75:1** — invisible | **fixed** (5.1, 5.2) — the strip sits on a neutral surface and is legible at 3.8:1–4.0:1 |
| **3.4** Clean up the 12-month trend | done | The legend said "Credit = white, Paid = black" while the bars were orange/black on a white card — legend and series disagreed | **fixed** (5.3) — credit is neutral `ink-muted`, paid is `positive`, the legend matches the bars |
| **3.5** Restyle Top Debtors rows | done | Rows were white cards on an orange page; the aging indicator was unreadable against that background | **fixed** (5.1) — rows on `surface` with a hairline border |
| **3.6** Home loading, pull-to-refresh, zero-data and error states | done | The error state was a white card with a `#525252` message on a brand background | **fixed** (5.1, 7.5) — the error card is a dark surface and every screen renders a real error state with a retry |
| **8.2** Correct the OfflinePendingBar icon and color logic | done | Emerald `#34D399` was used for the **online** state, and the pending/failed labels were `#F59E0B` / `#10B981` — money colours reused for sync status | **fixed** (6.3) — sync uses brand/ink-muted/danger; emerald is money only |
| **8.3** Audit every text/background token pair against WCAG AA | done | Home measured **3.55:1** (white on orange), **3.14:1** (`white/90`), **2.44:1** (`white/70`); `login.tsx` measured 1.9–3.1:1 | **fixed** (6.12, 5.1) and now **measured** by `scripts/check-contrast.ts` on every change |
| **8.4** Add a visible pressed state to every Pressable and respect reduced motion | done | ~20 pressables had no pressed state at all, and `react-native-reanimated` — a declared dependency — was never imported, so no transition existed | **fixed** (6.11) — one shared 120ms press feedback with reduced-motion support, wired into buttons, rows, tabs and filters |
| **8.1** Fix the QuickEntryModal submit button with a visible primary fill, readable label and light spinner | done | The button was fine; the **validation** was silent — an invalid amount returned without a message, so the tap did nothing | **fixed** (7.6) — the amount is rejected visibly and announced |

## Checked off, and genuinely present

These were verified in the code and left alone: 1.1 (tokens), 1.2 (fonts), 1.3 (dark theme),
1.4 (the visual-system doc), 2.1 (`Button`, `SectionHeader`, `MoneyText`), 2.2 (`AgingStrip` +
`lib/aging` + its tests), 2.3 (`CustomerAvatar`), 2.4 (launch screen), 3.1 (wordmark, greeting,
date, no bell), 4.1–4.4 (Ledger), 5.1–5.5 (Collection), 6.1–6.3 (Customers), 7.1–7.5 (Profile),
8.5 (lint, typecheck and tests pass).

The Ledger screen in particular was the reference implementation and needed no change.

## Still open

| Earlier task | Why it is still open |
|---|---|
| **8.6** Screenshot the launch screen and all five tabs in loaded, empty and offline states | The capture needs an iOS device, an Android device and a browser. Neither is attached to this machine (`adb devices` is empty, no desktop browser is connected to the session), so the matrix could not be captured here. Everything that could be verified without a device **was** verified: token resolution, WCAG ratios, lint, typecheck and the unit tests. |

## Recommendation

Do not archive `refine-mobile-ux-and-visual-system` until its 8.6 screenshot matrix is captured —
that is the check that was skipped, and it is the check that would have caught the nine
discrepancies above.

Separately, `mobile-five-screen-ui-refresh` (16/17) introduces a `mobile-shop-ui` delta whose
2x2 white metric cards, white Quick Actions card and cross-colour money semantics contradict the
`mobile-visual-system` capability. Reconcile the two before archiving either.

## What was done about it

The `mobile-shop-ui` delta was **reconciled before archive**. Its four superseded requirements —
the 2x2 metric-card grid, the segmented method selector on Home, the placeholder Profile header
and the growth promo card — are removed, and the requirements that remain describe the behaviour
the app actually ships: one hero figure with a supporting stat row, the method selector owned by
the quick-entry modal, the signed-in account's real identity, and emerald reserved for money
received.

`mobile-visual-system` is therefore the single contract for the mobile client, and the two
capabilities no longer contradict each other. The remaining open task in both changes (8.6 and
7.2) is the mobile screenshot matrix, which still needs a device.

## How the earlier checkmarks should be read from now on

A checked task in these changes means "the code was edited", not "the behavior was verified".
The verification gate for both changes is now:

```bash
bun run check:visual     # token resolution + WCAG contrast + forbidden literals
bun run lint
bun run typecheck
bun run test
```

plus the screenshot matrix, which still needs a device.
