# Ledger-X mobile visual system

The five-tab shopkeeper app and its launch screen use one visual language: orange for brand and action, neutral for structure, rose for risk, emerald only for money received.

## Color tokens

Defined in `apps/app/tailwind.config.js`.

| Token | Value | Use |
|---|---|---|
| `bg` | `#0A0A0A` | app background (neutral-950) |
| `surface` | `#171717` | cards, sheets, list surfaces (neutral-900) |
| `surface-raised` | `#262626` | inputs, selected rows, chips (neutral-800) |
| `line` | `#262626` | 1px hairlines (neutral-800) |
| `ink` | `#FAFAFA` | primary text and amounts (neutral-50) |
| `ink-muted` | `#A3A3A3` | dates, notes, secondary text (neutral-400) |
| `brand-primary` | `#EA580C` | brand, active tab, icons, selected state (orange-600) |
| `brand-primaryFill` | `#C2410C` | primary button fill behind white text (orange-700) |
| `brand-primaryText` | `#FB923C` | brand-colored text on dark (orange-400) |
| `positive` | `#34D399` | payments received only (emerald-400) |
| `danger` | `#E11D48` | destructive fills and 60+ aging (rose-600) |
| `danger-text` | `#FB7185` | destructive and overdue text on dark (rose-400) |

Blue and purple are not brand colors. Do not add a third chromatic brand hue.

### Contrast rules

- White on `brand-primary` (`#EA580C`) is 3.6:1. Use `brand-primaryFill` (`#C2410C`, 5.2:1) for any small white label on orange.
- `brand-primary` on `#0A0A0A` is 5.6:1 and is valid for icons and active labels.
- Body text floor on dark is `ink-muted` (5.6:1). `#737373` is allowed for non-text strokes only.
- `danger` with white text is 4.7:1; use `danger-text` for small text on dark.
- Never communicate owed vs received with color alone; keep signs and text labels.

## Type scale

| Role | Family token | Size / line | Weight |
|---|---|---|---|
| Hero amount | `font-mukta-black` | 34 / 38, tabular | 800 |
| Screen title | `font-mukta-bold` | 24 / 30 | 700 |
| Section title | `font-mukta-semibold` | 16 / 22 | 600 |
| Body / rows | `font-mukta` | 15 / 22 | 400 |
| Emphasized row text | `font-mukta-semibold` | 15 / 22 | 600 |
| Meta | `font-mukta-medium` | 13 / 18 | 500 |
| Ledger label | `font-plex` | 11 / 14, uppercase, +0.08em | 500 |
| Inline amount | `font-mukta-bold` | 15 / 20, tabular | 700 |

All amounts set `fontVariant: ['tabular-nums']`. IBM Plex Mono has no Devanagari; use it only for Latin labels, dates, and numerals, never names.

## Surfaces and layout

- Gutter 20, section gap 28, card padding 16, list row min height 64, touch target 44.
- Radius: card 16, control 12, chip 999.
- 1px `line` borders; no shadows on dark surfaces; no white content cards.
- One hero figure per screen. Supporting stats are inline text separated by hairlines.
- Buttons: primary (`brand-primaryFill` + white), secondary (transparent + border + `ink`), ghost, danger (`danger` + white).
- Filters are underline tabs, not filled pills.
- Pressed state: 0.8 opacity plus a darker fill, 120ms.

## Money meanings

| State | Expression |
|---|---|
| Outstanding balance | `ink` amount, neutral; rose only when the oldest unpaid credit is 60+ days |
| Payment received | `positive` with a `−` sign |
| Credit given | `ink` with a `+` sign |
| Overdue 0–30 days | neutral segment |
| Overdue 31–60 days | `danger-text` indicator segment |
| Overdue 60+ days | `danger` indicator segment |
| Destructive action | `danger` fill or `danger-text` label |

Emerald is reserved for payments received. It is never a generic "good", "selected", "online",
"onboarding step", or "unlocked" colour — in a ledger green means one thing only.

## Aging color map

One map drives the aging strip, the aging legend, and every per-customer aging indicator. The
legend and the strip must always be rendered from the same source so they cannot disagree.

| Bucket | Fill | Used for |
|---|---|---|
| 0–30 days | `#737373` (`bg-[#737373]`) | neutral segment — non-text use only |
| 31–60 days | `#FB7185` (`bg-danger-text`) | segment and overdue label |
| 60+ days | `#E11D48` (`bg-danger`) | segment and overdue label |

Contrast on the dark surfaces: `#737373` 4.2:1, `#FB7185` 7.0:1, `#E11D48` 4.6:1. These fills are
legible on `#0A0A0A` and `#171717` and invisible on the brand orange, so the aging strip always
sits on a dark neutral surface.

## Home composition

Home is a dark ledger page, not a brand-coloured one.

- Screen background `bg` `#0A0A0A`; every card and row is `surface` `#171717` with a 1px `line`
  border. There are no white content cards.
- The wordmark is `ink` with the `X` in `brand-primary`; the greeting is `ink-muted`.
- One hero figure: total outstanding, 34/38 mukta-black, `ink`, tabular.
- The proportional aging strip and the aging legend sit directly under the hero and share the
  aging color map above.
- Supporting figures (customers, this month, net balance) are an inline row separated by
  hairlines — never a 2x2 grid of equal metric cards.
- The 12-month trend draws credit given in neutral `ink-muted` and payments received in
  `positive`; its legend dots match the bar colours exactly.
- Primary action "Add credit" uses `brand-primary-fill` `#C2410C` with white text (5.2:1).
  "Record payment" is a secondary outline button with an `ink` label.
- Zero-data Home shows a formatted `₹0` hero and a direct "Add customer" action.

## Press feedback

Every pressable shows a pressed state before navigation or submission: 0.8 opacity plus a darker
fill, over 120ms. When the device requests reduced motion the transition collapses and the state
change stays visible.

## Touch targets

Every control — including icon-only header actions, inline links and small chips — has a tappable
area of at least 44x44 points, and adjacent controls are at least 8pt apart.
