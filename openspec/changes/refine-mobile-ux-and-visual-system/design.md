# Design

## Context

See `proposal.md` for motivation and `specs/mobile-visual-system/spec.md` for the behavior contract. The current implementation uses NativeWind 4.2.1 on Tailwind 3.4.17, Expo SDK 58, and a dark-only screen set. Relevant current-state facts:

- `apps/app/tailwind.config.js` already defines `brand-dark/card/accent/primary/border`, but screens bypass it with hardcoded values (`#FF6A00`, `#1E1E1E`, `#2D2D2D`, `#3D3D3D`, `#444444`, `#666666`, `#888888`, `#AAAAAA`).
- No custom font is loaded; `expo-font` is installed but unused. Sizes range from 8px to 52px with no scale.
- Home uses four equal white metric cards; Collection uses a full white Quick Actions card. Both are the brightest surfaces and compete with the primary action.
- Money colors contradict each other: credits are green `#22C55E` in Ledger, debtors are orange on Home, outstanding is white in Collection, and payments are red `#EF4444`.
- `GET /dashboard/recent-transactions` returns only the five most recent entries (`.limit(5)`); there is no global paginated transactions endpoint. `GET /dashboard/analytics` returns aggregate `aging` buckets (`0-30`, `31-60`, `60+`) and `GET /collection` returns per-customer `outstanding` and `ageDays` but not per-bucket rupees.
- `expo-print` and `expo-sharing` are installed; `expo-file-system` 58.0.13 is present transitively but not declared.

## Goals / Non-Goals

**Goals:**
- One token source for color, type, spacing, radius, and surface rules, consumed by all five tabs and the launch screen.
- WCAG AA text and control contrast, 44px targets, and color-independent money meaning.
- A single screen-composition grammar: one hero figure, quiet supporting stats, hairline structure.
- The aging visualization as the product's signature, grounded in data that actually exists.
- Controls that perform their labeled action or disappear.

**Non-Goals:**
- No API, schema, auth, or offline-queue changes; no full-history ledger or per-row running balance in this change.
- No web re-theme; `apps/web` stays emerald for now.
- No light theme, no new chart library, no notification backend, no UPI payment verification.
- No new image assets or illustrations; the identity is carried by type, rules, and data visualization.

## Decisions

### 1. Color: orange is the brand, roles are fixed

| Token | Value | Role |
|---|---|---|
| `bg` | `#0A0A0A` (neutral-950) | app background |
| `surface` | `#171717` (neutral-900) | cards, sheets, list surfaces |
| `surfaceRaised` | `#262626` (neutral-800) | inputs, selected rows, chips |
| `line` | `#262626` (neutral-800) | 1px hairlines |
| `ink` | `#FAFAFA` (neutral-50) | primary text, amounts |
| `inkMuted` | `#A3A3A3` (neutral-400) | dates, notes, secondary text |
| `brand` | `#EA580C` (orange-600) | active tab, icons, selected state, brand marks |
| `brandFill` | `#C2410C` (orange-700) | primary button fill behind white text |
| `brandText` | `#FB923C` (orange-400) | brand-colored text on dark |
| `positive` | `#34D399` (emerald-400) | payments received |
| `danger` | `#E11D48` (rose-600) | destructive fill, 60+ aging |
| `dangerText` | `#FB7185` (rose-400) | destructive and overdue text on dark |

Rules: orange is the only brand hue; rose is never decorative; emerald only means money received. Blue and purple are excluded. A third chromatic brand color would dilute orange and rose exactly as blue diluted the app's value.

**Accessibility recipe:** white on `#EA580C` is 3.6:1, so white-text primary buttons use `#C2410C` (5.2:1). `#EA580C` is still the brand token for icons, active tabs, and non-text fills (5.6:1 against the background). Text floor on dark is `#A3A3A3` (5.6:1); `#737373` (4.2:1) is restricted to non-text strokes. Rose-600 with white is 4.7:1 and is safe for destructive buttons.

Alternative considered: keep blue-500 as primary. Rejected because it is the category default and separates poorly from avatar/link/selection semantics. Alternative: orange + rose + purple. Rejected because three chromatic brand roles cancel each other.

### 2. Type: receipt/ledger pairing

Add `@expo-google-fonts/mukta` and `@expo-google-fonts/ibm-plex-mono`. Load four Mukta weights and one Plex Mono weight; register each weight as a named family so React Native does not synthesize weights.

| Role | Family | Size / line | Weight |
|---|---|---|---|
| Hero amount | Mukta | 34 / 38, tracking -0.5 | 800 |
| Screen title | Mukta | 24 / 30 | 700 |
| Section title | Mukta | 16 / 22 | 600 |
| Body / rows | Mukta | 15 / 22 | 400 |
| Emphasized row text | Mukta | 15 / 22 | 600 |
| Meta | Mukta | 13 / 18 | 500 |
| Ledger label | IBM Plex Mono | 11 / 14, uppercase, +0.08em | 500 |
| Inline amount | Mukta | 15 / 20 | 700 |

All amounts use `fontVariant: ['tabular-nums']`. The hero uses `adjustsFontSizeToFit` with a minimum scale so long amounts do not clip. IBM Plex Mono has no Devanagari — never use it for names or notes. If fonts fail to load, render system sans with tabular numerals rather than blocking the app.

Mukta was chosen over a Latin-only display face because shop names and notes are frequently Devanagari; a fallback would fracture the type treatment. The mono face is the "receipt voice" that makes ledger metadata feel intentional.

### 3. Layout primitives

- Gutter 20, section gap 28, card padding 16, list row min height 64, touch target 44.
- Radius: card 16, control 12, chip 999. Hairline 1px `line`; no shadows on dark surfaces.
- One hero figure per screen. Supporting stats are a row of text separated by vertical hairlines, not equal cards.
- Buttons: primary (`brandFill` + white), secondary (transparent + `line` border + `ink`), ghost (text/icon only), danger (`danger` + white). Pressed state = 0.8 opacity plus a slightly darker fill; 120ms.
- Section naming uses the mono label above a 1px rule, not numbered markers (the content is not a sequence).
- Filters render as an underline tab: active label `ink` with a 2px `brand` rule, inactive `inkMuted`, no filled pill track.

### 4. Screen composition

**Home** — a ledger page header instead of a dashboard grid:

```
Ledger-X                       12 NOV
TOTAL OUTSTANDING
₹2,48,500
▓▓▓▓▓▓▓▓▓░░  ● 0–30  ● 31–60  ● 60+
oldest unpaid 42 days
────────────────────────────────
Customers 42 │ This month +₹18k │ Balance ₹1.2L
[ + Add credit ]   [ Record payment ]
12-MONTH TREND            Credit  Paid
TOP DEBTORS                View all
```

- Greeting uses the real first name from the session; date is mono.
- Hero = total receivables. Global aging strip = aggregate `analytics.aging` (proportional rupees).
- Remove the Cash/UPI/Other segmented control; `QuickEntryModal` already contains the payment-method selector, so the Home control only created ambiguity.
- Remove the notification bell until a notifications surface exists. Remove the "Recent activity appears in Ledger · now" footer.
- Trend: keep the existing two-series View implementation, 3px bars, `neutral-800` baseline, 11px mono labels, no bar drawn for zero values.

**Ledger** — header title plus count; a single inline search field filtering customer name and note; underline filters with counts; `SectionList` grouped by day. Rows show avatar, name, note, signed amount, and date. Because the endpoint returns five entries, the header reads `Recent activity · last 5` and the screen does not imply a complete ledger. A full-history ledger with running balance is deferred.

**Collection** — QR is the only hero. Border `brand`/30, a single brand hairline across the top, QR on white only inside its quiet zone. Below: payee and UPI ID in mono, `Share QR code`. Quick actions become three compact icon+label buttons on a dark surface: Copy UPI ID, Download QR, Print QR. The shop-wide QR omits `am` (no pre-filled ₹1); per-customer QRs include the amount. Add a visible `Largest / Oldest` sort control wired to the existing `sort` state. Per-row QR control is 44px and explains missing UPI setup instead of silently doing nothing.

**Customers** — one search field; remove the dead header magnifier and filter icon. Rows always show name and phone; balance and aging indicator appear when outstanding. Neutral avatars with a per-name muted tint only if scanning tests require it; never brand orange.

**Profile** — identity header using the real name/email (shop icon avatar); sections: Payment settings, Data & export, App lock, Sample data; the promo card becomes a tappable "Invite a shopkeeper" share action or is removed. Destructive account deletion is a collapsed row that opens a confirmation sheet. Exactly one logout control in a Session section. Remove the placeholder Business Details / Help & Support / About rows; informational alerts are not navigation.

**Launch (`app/index.tsx`)** — replace green with the orange/neutral system, reuse the wordmark treatment and primary button.

### 5. Aging visualization grounded in available data

- **Home:** `analytics.aging` gives rupees per bucket, so render a proportional three-segment strip. This is accurate.
- **Customer rows:** the API exposes only `outstanding` and `ageDays`, not rupees per bucket. Render a fixed three-segment indicator with the bucket containing the oldest unpaid credit active (`0–30` neutral-500, `31–60` rose-400, `60+` rose-600) plus a text label (`Unpaid 42d`). Do not fake proportional segments.
- One legend on Home under the strip. Urgency is always also expressed in text, never color alone.
- Shared `AgingStrip` component supports `mode="proportional"` (Home) and `mode="bucket"` (rows) so the visual language stays identical.

### 6. Affordance resolutions

| Control | Resolution |
|---|---|
| Home bell | Remove until notifications exist |
| Ledger header search | Replace with an inline search field; remove the icon |
| Customers header search + filter | Remove both; keep the single working input |
| Collection sort state | Add a `Largest / Oldest` control |
| Download QR | `react-native-qrcode-svg` `toDataURL` → write PNG to cache with `expo-file-system` → `Sharing.shareAsync(fileUri)`; if QA cannot make it reliable on both platforms, remove the action |
| Print QR | `expo-print` with an HTML page embedding the QR data URL |
| Per-row QR with no UPI | Visible disabled state and inline guidance, not a silent no-op |
| Profile menu placeholders | Remove; keep only rows/sections that work |
| Duplicate logout | Single control |
| Delete account | Collapsed row → confirmation sheet |
| QuickEntry submit | Visible `brandFill` button with white label and light spinner; fix the missing background |
| Offline bar icon | Correct icon logic so online shows online, offline shows offline |

### 7. Motion and feedback

Use a 120ms opacity/background pressed state on every Pressable (the current app has none except the launch screen). Filter and sort changes may animate the underline at 150ms with Reanimated, which is already installed. Respect `AccessibilityInfo.isReduceMotionEnabled`; native modal slide is unchanged. No ambient animation, parallax, or decorative loops.

### 8. Theme scope

Set `userInterfaceStyle: "dark"` in `app.json` and keep the light status bar. The app is dark-only in this change; `automatic` currently promises a theme that does not exist. Web stays out of scope, so the brand is consistent within mobile first.

## Risks / Trade-offs

- [Risk] Orange is close to the current build, so the refresh may look unchanged at a glance. → Mitigation: the visible difference must come from the hero layout, typography, hairline surfaces, and aging strip; review screenshots before/after each screen.
- [Risk] Loading two font families adds bundle and startup work. → Mitigation: load four Mukta weights and one mono weight; show system fallback if loading fails; measure cold start on a low-end Android device.
- [Risk] Per-customer aging cannot be proportional with current data. → Mitigation: use the documented bucket indicator and label; do not imply rupee precision.
- [Risk] The Ledger feed is only five entries. → Mitigation: label it as recent activity; defer full history to a paginated endpoint change.
- [Risk] QR file download differs by platform. → Mitigation: QA on iOS and Android; if a platform cannot produce a file reliably, remove Download rather than shipping a lie.
- [Risk] Two active changes disagree about Home composition and money colors. → Mitigation: reconcile `mobile-shop-ui` with `mobile-visual-system` before archiving either; this change is the newer visual contract.
- [Risk] Font fallback or mono used for Devanagari names. → Mitigation: restrict mono to Latin labels and numerals; test with Devanagari sample data.
- [Risk] Color-only aging. → Mitigation: text labels and day counts accompany every indicator.

## Migration Plan

1. Add tokens and fonts with no screen changes; verify `typecheck`, `lint`, and app boot.
2. Build shared primitives (button, section header, money text, aging strip, list row) and update the launch screen.
3. Convert Home, then Ledger and Collection, then Customers and Profile.
4. Remove dead controls and fix QuickEntry/OfflineBar behavior in the same pass as their screen.
5. Run `bun run lint`, `bun run typecheck`, `bun run test`; capture iOS and Android screenshots for all five tabs plus the launch screen.
6. Rollback is a single revert: no data migration, no API contract, no persisted state changes.

## Open Questions

- Should a follow-up raise the recent-transactions limit or add a paginated global endpoint for a true full ledger? This is safely deferred because the spec labels the current feed as recent activity.
