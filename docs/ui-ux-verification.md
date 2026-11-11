# Ledger-X — UI/UX remediation verification

Change: `audit-ui-ux-and-generate-artifacts`
Date: 2026-11-10

## What was verified, and how

| Check | Command | Result |
|---|---|---|
| Every web custom property and custom utility is declared | `bun run check:tokens` | ✓ passes — `globals.css` references no undeclared property, and every custom class used in `app/` and `components/` exists in the built stylesheet |
| The build declares the brand ramp | `bun run check:tokens` | ✓ `--brand`, `--brand-light`, `--brand-fill`, `--brand-deep`, `--brand-text` and `--positive` are all present in the compiled CSS |
| WCAG ratios of every named token pair | `bun run check:contrast` | ✓ 27/27 pairs meet their floor (web light + dark, mobile dark) |
| No forbidden colour literal on mobile | `bun run --cwd apps/app check:visual-tokens` | ✓ no blue/purple/off-token-grey/emerald-misuse left in the app sources |
| No off-token palette class on web | `bun run check:colors` | ✓ no blue/purple/teal, no emerald outside the money role, and no raw red/amber/rose in the web sources |
| Lint | `bun run lint` | ✓ 2/2 workspaces, 0 errors |
| Typecheck | `bun run typecheck` | ✓ 3/3 workspaces |
| Unit tests | `bun run test` | ✓ 63 tests pass (19 web, 44 mobile), 0 failures |
| Web production build | `cd apps/web && bun run build` | ✓ 12 routes prerender |
| Web screenshot matrix (task 8.3) | `bun run scripts/capture-web.ts` | ✓ 28 screenshots attached — every screen in both themes, plus the 360px pass |

### Measured contrast

```
web/light  body text on the page      20.87:1      web/dark   body text on the page      20.87:1
web/light  muted text on a card       17.41:1      web/dark   muted text on a card       17.41:1
web/light  primary button label        5.18:1      web/dark   primary button label        5.18:1
web/light  brand text on the page       5.18:1      web/dark   brand text on the page       5.18:1
web/light  money received on a card     5.48:1      web/dark   money received on a card     5.48:1
web/light  destructive label on a card  5.89:1      web/dark   destructive label on a card  5.89:1
web/light  chart series 1 (paid)        5.48:1      web/dark   chart series 1 (paid)        5.48:1
web/light  chart series 2 (credit)      7.63:1      web/dark   chart series 2 (credit)      7.63:1
mobile/dark  primary text on the app background      18.97:1
mobile/dark  muted text on the app background        7.85:1
mobile/dark  muted text on a surface                 7.11:1
mobile/dark  white label on the brand fill           5.18:1
mobile/dark  brand text on the app background        8.75:1
mobile/dark  money received on a surface             9.33:1
mobile/dark  overdue text on a surface               6.66:1
mobile/dark  60+ aging segment on a surface          3.82:1   (floor 3:1, non-text)
mobile/dark  0-30 aging segment on a surface         3.78:1   (floor 3:1, non-text)
```

The aging strip on the old brand-orange Home measured **0.75:1 / 1.32:1 / 0.75:1**. It now measures
3.78:1–3.82:1 on the neutral surface it actually sits on.

### The checks fail when the defect is reintroduced

Both scripts were verified against a deliberate regression:

- removing `--brand` from `globals.css` → `check:tokens` reports
  `globals.css references --brand, which is never declared`
- changing a button to `bg-blue-500` → `check:visual-tokens` reports the violation and exits 1

## The web screenshot matrix (task 8.3)

Captured with `bun run scripts/capture-web.ts`, which drives the locally installed Chrome over the
CDP protocol against the **production** build served on `http://127.0.0.1:3000` with the mock API
(`bun run scripts/mock-api.ts`) behind it. Driving Chrome directly is what makes the capture possible
without the desktop app's browser tool.

All 28 screenshots are attached under
`openspec/changes/audit-ui-ux-and-generate-artifacts/screenshots/web/`:

| Screen | Desktop (1440) | 360px pass |
|---|---|---|
| Login | `01-login-{dark,light}.png` | `08-login-360-{dark,light}.png` |
| Dashboard | `02-dashboard-{dark,light}.png` | `09-dashboard-360-{dark,light}.png` |
| Customers | `03-customers-{dark,light}.png` | `10-customers-360-{dark,light}.png` |
| Customer detail | `04-customer-detail-{dark,light}.png` | `11-customer-detail-360-{dark,light}.png` |
| Statement | `05-statement-{dark,light}.png` | `12-statement-360-{dark,light}.png` |
| Collection | `06-collection-{dark,light}.png` | `13-collection-360-{dark,light}.png` |
| Settings | `07-settings-{dark,light}.png` | `14-settings-360-{dark,light}.png` |

### What the review found, and what was fixed

The first capture pass was reviewed against `specs/web-visual-system/spec.md` and **four defects
were found and fixed** before the matrix was re-captured:

1. **Blue, purple and teal accents on the customer detail.** The avatar gradient ramp carried
   `cyan-400 → blue-500`, `violet-400 → purple-500`, `sky-400 → cyan-500` and
   `emerald-400 → teal-500`, and the Transactions stat card used `violet-500`. The spec's *No
   competing brand hues* scenario requires that no blue or purple brand accent appears on any web
   screen. Both avatar ramps now come from one shared helper (`apps/web/lib/avatar.ts`) built from
   the brand ramp and true neutrals, so the customer list and the customer detail header can no
   longer disagree, and the Transactions card uses the muted token.

2. **The money model was still inverted on the statement.** *Total credit* rendered emerald and
   *Total paid* rendered red — the exact inversion the change set out to fix, and the one the
   proposal names as the defect that makes a ledger unreadable. Credit given is now neutral ink and
   a received payment is the `positive` token, matching `lib/money.ts` and the mobile statement.
   The payment-method badge moved off amber onto the same `positive` role.

3. **The customer analytics cards carried the same inversion**, plus a violet accent: *Total
   Credit / Money received* in brand orange and *Total Debit / Money paid out* in red. The cards now
   read *Total Credit / Credit given* (neutral) and *Total Paid / Payment received* (positive),
   matching the labels the mobile client uses for the same two totals.

4. **Emerald and off-token reds outside their roles.** The collection list used emerald for a
   settled balance, amber for a 31–60 day age and `red-400` past 60 days; the settings CSV icons
   were emerald; the delete dialog used raw `red-500`. The aging map now runs neutral → rose →
   deep rose as on mobile, the CSV icons use the brand ramp, and the destructive surfaces use the
   `destructive` token so they adapt per theme.

`bun run check:colors` is the new gate that keeps these from coming back: it fails on any
blue/purple/teal, any emerald outside the money role, and any raw red/amber/rose/green palette
class in the web sources — the web counterpart of the mobile `check:visual-tokens` script.

### The matrix confirms the spec

| Requirement | Evidence in the matrix |
|---|---|
| Brand and semantic color roles | No blue, purple or teal appears on any screen; emerald appears only on received money |
| Declared tokens resolve to real values | Both themes render opaque surfaces; `check:tokens` passes against the built CSS |
| Typography and money numerals | Amount columns align by digit; no text renders below 12px |
| Chart series carry meaning and a fallback | The dashboard's credit series is hatched, the paid series solid, both legibly labelled with a text summary |
| Every action is reachable and named | Row actions are visible without hover; icon-only controls carry accessible names |
| Forms explain their state | The statement filter and the settings UPI form show labelled fields with inline errors |
| Loading, empty and error states are honest | No screen renders a failed request as an empty result |
| Small screens and safe areas | At 360px the page does not scroll horizontally; the statement table scrolls inside its own container; the bottom nav clears the home indicator |
| Navigation is predictable | One landing route; breadcrumbs mark the current page |

## What could not be verified here

The **mobile screenshot matrix (task 8.4)** still needs capture hardware that is not attached to
this machine:

- `adb devices` lists no Android device and no emulator is installed
- no iOS simulator is reachable, and Agent device access is off in this session

Everything that could be verified without a device **was** verified: token resolution, WCAG
ratios, forbidden-literal scans on both clients, lint, typecheck, unit tests, a production build,
and now the complete web screenshot matrix. The mobile matrix is the last gate before this change
can be archived.

To capture it:

```bash
# mobile
cd apps/app && bun run start        # Expo dev client on a connected device
#   capture: launch screen, the five tabs, add/edit customer, statement, app lock
#   in loaded, empty and offline states on iOS and Android
```

## Behaviour worth re-checking by hand

Three changes are correct in code but were not observed on a device:

1. The **press feedback** (120ms opacity, reduced-motion aware) — confirm a press is felt on a
   button, a row and a filter tab.
2. The **tab bar** no longer sets an explicit height — confirm the labels are not clipped on a
   notched device now that React Navigation owns the height.
3. The **queue merge** — record an entry offline and confirm it appears once in Ledger, once in
   the Home outstanding figure, and disappears (not duplicates) after it syncs.
