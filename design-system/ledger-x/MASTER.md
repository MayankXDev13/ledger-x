# Ledger-X — Design System (Master)

> **Source of truth for both clients.** Read this before building or reviewing any screen.
> Page-level overrides live in `design-system/ledger-x/pages/*.md` and override this file.
>
> Generated with the `ui-ux-pro-max` skill (design-system search, `--design-system`, dials
> variance 4 / motion 3 / density 7), then reconciled against the shipped code in
> `apps/web` and `apps/app` and the contract in `docs/mobile-visual-system.md`.
>
> Last reconciled: 2026-11-10

---

## 0. What this product is

A digital **khata** (ledger) for small shops. The user is a shop owner, not an accountant.

| | |
|---|---|
| Product type | Operational SaaS / fintech-lite (records, receivables, collection) |
| Primary audience | Indian small-shop owners (kirana, hardware, service shops) — mixed digital fluency, low tolerance for jargon, often Android + cheap hardware + intermittent network |
| Context of use | Standing at a counter, one hand on the phone, possibly outdoors in daylight; second context is a desktop in the evening for statements/analytics |
| Trust model | The user is lending money. Money direction must never be ambiguous |
| Currency / locale | INR, `en-IN` grouping (lakh/crore), ₹ prefix, `Intl.NumberFormat("en-IN")` |
| Names | Devanagari is common → **every font used for names must support Devanagari** |
| Platforms | `apps/web` (Next.js 16, Tailwind v4, shadcn/radix, recharts) · `apps/app` (Expo 58 / RN 0.88, NativeWind v4) |

### Design principles

1. **One hero number per screen.** Everything else is supporting text or a hairline-separated stat.
2. **Money direction is never carried by color alone.** Sign (+ / −), label, and position carry it;
   color only reinforces. Credit given = neutral. Payment received = emerald. Overdue 60+ = rose.
3. **Earning attention is expensive.** Shopkeepers open the app to do one thing (record a credit,
   take a payment, check who owes). Every extra step costs a real customer.
4. **The ledger is dense but never cramped.** Row rhythm is fixed; hierarchy comes from weight and
   hairlines, not from big empty cards.
5. **It must work on a ₹7,000 Android phone in a patchy network.** Dark OLED surfaces, no heavy
   imagery, offline-tolerant reads, skeleton loaders that reserve space.

---

## 1. Color system

### 1.1 Brand ramp — orange, identical on web and mobile

| Role | Hex | Token (mobile `tailwind.config.js`) | Token (web `globals.css`) |
|---|---|---|---|
| Brand identity / active state / icons | `#EA580C` | `brand.primary` | `--brand` → `--color-brand` |
| Accessible fill behind white labels | `#C2410C` | `brand.primary-fill` | `--brand-fill` → `--color-brand-fill` |
| Gradient end (deep orange) | `#9A3412` | — | `--brand-deep` → `--color-brand-deep` |
| Brand text on dark surfaces | `#FB923C` | `brand.primary-text` | `--brand-text` → `--color-brand-text` |
| Light orange (decorative only) | `#FB923C` | `brand.soft` | `--brand-light` → `--color-brand-light` |
| Soft tint (chips, selected rows) | `#FFEDD5` | `brand.soft` | `--color-brand/10` (opacity modifier) |

On web, `--primary` points at `--brand-fill` (`#C2410C`) so every primary button carries a white
label at 5.2:1, and `--positive` is the only emerald token (light `#047857`, dark `#34D399`).

**Rule:** orange is the only chromatic brand hue. **No blue, no purple, no teal.** A second
chromatic hue in a product this small reads as a different brand.

### 1.2 Neutral ramp

| Role | Dark (mobile) | Web dark | Web light |
|---|---|---|---|
| App background | `#0A0A0A` | `--background` | `--background` |
| Card / sheet surface | `#171717` | `--card` | `--card` |
| Raised surface (inputs, chips, selected rows) | `#262626` | `--muted` / `--input` | `--muted` |
| Hairline border | `#262626` | `--border` | `--border` |
| Primary text | `#FAFAFA` | `--foreground` | `--foreground` |
| Muted text | `#A3A3A3` | `--muted-foreground` | `--muted-foreground` |

### 1.3 Semantic money colors — **the most important rule set in the system**

| Meaning | Color | Where it is allowed | Where it is forbidden |
|---|---|---|---|
| Payment received / money in | emerald `#34D399` (`positive`) | received payments, "collected" totals, positive balance deltas | onboarding steps, app-lock buttons, selection states, "online" status, generic success icons |
| Credit given / money out | **neutral ink**, never a hue | credit rows, credit totals | any green/red fill |
| Outstanding balance | neutral `ink` | balances, list amounts | painting a receivable red by default |
| Overdue 0–30 d | neutral segment | aging strip | — |
| Overdue 31–60 d | `danger-text` `#FB7185` | aging strip segment | — |
| Overdue 60+ d | `danger` `#E11D48` | aging strip segment, overdue label | — |
| Destructive action | `danger` / `danger-text` | delete, destructive confirm, account deletion | ordinary balances, ordinary rows |

> Green is **not** a generic "good/active/selected" color here. In a ledger, green means
> "this money arrived". Reusing it for selection states destroys the meaning.

### 1.4 Contrast floors

| Pair | Ratio | Verdict |
|---|---|---|
| White on `#EA580C` (orange-600) | 3.6:1 | ❌ only for ≥18.66px bold / ≥24px text |
| White on `#C2410C` (orange-700) | 5.2:1 | ✅ the fill for any small white label on orange |
| `#EA580C` on `#0A0A0A` | 5.6:1 | ✅ icons, active labels |
| `#A3A3A3` on `#0A0A0A` | 5.6:1 | ✅ body/muted text floor on dark |
| `#EA580C` on white | 3.6:1 | ❌ for text — use `#C2410C` |
| `#FB7185` on `#0A0A0A` | 7.0:1 | ✅ overdue text on dark |
| `#E11D48` with white text | 4.7:1 | ✅ destructive fill |

Minimum 4.5:1 for body text, 3:1 for large text (≥24px, or ≥18.66px bold) and for non-text
UI (icons, borders, chart strokes).

### 1.5 Chart series palette (web)

The dashboard plots **credit given** vs **payments received** and a 12-month trend. Requirements:

- Two series must be distinguishable **without** color: pair hue with a **different line dash /
  bar fill pattern** and a **direct text label**; every chart needs a visible legend with text.
- Credit given → neutral/ink or a muted warm tone. Payments received → emerald.
  **Never** red for money that arrived.
- Use the token values, not literals: `--chart-1 … --chart-5`. Shipped ramp:
  `--chart-1` = emerald (paid), `--chart-2` = stone (credit given), `--chart-3` = rose (overdue),
  `--chart-4` = brand orange, `--chart-5` = amber — each with a distinct light and dark value
  that clears 4.5:1 against its card.
- Grid lines must use a theme-aware value (`var(--border)`), never `rgba(255,255,255,0.04)`.
- Every chart ships a text fallback: a one-line trend summary and/or a data table beneath it.

---

## 2. Typography

### 2.1 Families

| Platform | UI text | Numerals / ledger labels | Note |
|---|---|---|---|
| Mobile | **Mukta** (400/500/600/700/800) | **IBM Plex Mono** 500 | Plex has no Devanagari → never for names |
| Web | **Mukta** (400/500/600/700) | **JetBrains Mono** | Same UI family on both clients; Source Sans 3 was dropped because it ships no Devanagari subset in `next/font` |

Do not load more families than this. Customer names may be written in Devanagari, so the UI family
must cover it; the monospaced family is for Latin labels, dates, and numerals only.

### 2.2 Scale

| Role | Size / line | Weight | Family |
|---|---|---|---|
| Hero amount | 34 / 38 | 800 | Mukta Black / bold | 
| Screen title | 24 / 30 | 700 | Mukta Bold |
| Section title | 16 / 22 | 600 | Mukta Semibold |
| Body / list row | 15 / 22 | 400 | Mukta |
| Emphasized row text | 15 / 22 | 600 | Mukta Semibold |
| Meta (dates, notes) | 13 / 18 | 500 | Mukta Medium |
| Ledger label | 11 / 14, uppercase, `0.08em` | 500 | Plex |
| Inline amount | 15 / 20 | 700 | Mukta Bold |

Web adds: `text-xs` (12px) is the floor for secondary text. **`text-[9px]`, `text-[10px]`,
`text-[11px]` are not allowed for web body/meta text** — 11px uppercase tracking labels are
mobile-only. The web floor is 12px.

### 2.3 Rules

- **All monetary values use tabular numerals.** Tailwind: `tabular-nums` (not `tabular`).
  React Native: `fontVariant: ['tabular-nums']`. Digits must not shift horizontally as values change.
- Line height 1.45–1.6 for body text. Never `line-height: 1` on multi-line text.
- Currency: `Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 })`.
  One shared helper — it is currently duplicated in 5+ web files.
- Truncate customer names to one line with an ellipsis; the full name belongs to the detail screen.

---

## 3. Spacing, radius, elevation

| Token | Mobile | Web | Use |
|---|---|---|---|
| Gutter | 20 | 16 / 24 (`p-4 sm:p-6 lg:p-8`) | screen edge padding |
| Section gap | 28 | 24 | between sections |
| Card padding | 16 | 16–20 | inside a card |
| List row min height | 64 | 56 | tappable row |
| Touch target | 44 | 44 (mobile web), 24 CSS px min (desktop per WCAG 2.5.8) | every control |
| Card radius | 16 | 16 (`--radius-xl`) | cards, sheets |
| Control radius | 12 | 12 (`--radius-lg`) | inputs, buttons, chips |
| Chip radius | 999 | 999 (`rounded-full`) | pills only |
| Border | 1px `line` | 1px `border` | hairline separators |

Web radius scale (`apps/web/app/globals.css`): `--radius-lg: 12px` (controls),
`--radius-xl`/`-2xl`/`-3xl`/`-4xl: 16px` (cards and surfaces), `rounded-full` for chips.
`--radius: 12px` is the base.

- **No shadows on dark surfaces.** Depth comes from surface lightness (`surface` →
  `surface-raised`) and 1px hairlines.
- Web `--radius` is currently `0`, so every shadcn component renders with square corners while
  hand-rolled components use `rounded-xl`. Pick one radius scale and apply it everywhere.

---

## 4. Component specs

### 4.1 Buttons

| Variant | Fill | Label | Use |
|---|---|---|---|
| Primary | `brand-fill` `#C2410C` (web: `--primary`) | white | the one main action on a screen |
| Secondary | transparent + 1px border | `ink` | alternative actions |
| Ghost | transparent | `ink` | tertiary, in-row actions |
| Danger | `danger` `#E11D48` | white | delete, destructive confirm |

- One primary button per view. Two primaries is a design bug.
- Height: 44–48px on touch, 36px on desktop dense rows.
- Pressed: opacity 0.8 **plus** a darker fill, 120ms.
- Loading: keep the label, add a spinner, disable the button. Never swap the button for a spinner.
- Every icon-only button needs an accessible name (`aria-label` / `accessibilityLabel`).

### 4.2 Filters / tabs

- Filters are **underline tabs** (label + 2px accent underline), never filled pills.
- Active tab: `brand-text` label + underline; inactive: `ink-muted`.
- Include the result count in the tab label when there is one.

### 4.3 List rows

```
[icon 32]  [type badge · note]      [+ ₹1,200]
           [date · balance after]    [edit][delete]
```
- 64px min height on mobile, 1px hairline between rows, no card per row.
- Amount right-aligned, tabular, always signed.
- **Row actions must be visible without hover.** Hover-revealed actions are unreachable on touch
  and on keyboard. Use a always-visible trailing action area or a long-press / swipe menu.

### 4.4 Cards & surfaces

- One card per concept. No nested cards, no card-in-card.
- Header row: title (16/22 semibold) + optional meta; actions on the right.
- Never a white card on a dark surface.

### 4.5 Forms

- Visible label above every input. Placeholder is a hint, **never** the label.
- Error text directly under the field it belongs to, wired with `aria-describedby` /
  `accessibilityHint`; error is announced (`role="alert"` / `accessibilityLiveRegion`).
- Validate on blur, re-validate on change after the first error.
- Submit button shows loading → success/error. Success feedback must be visible on the screen
  (toast or inline), never silent.
- A failed submit moves focus to an error summary that links to each invalid field.
- Numeric fields: numeric keyboard, `returnKeyType`, and a `+` / `−` prefix for amounts.

### 4.6 Empty / loading / error states

Every data surface needs all three:

- **Loading:** skeleton that reserves the final layout height (avoid CLS). Spinner only for
  full-screen waits under 300ms.
- **Empty:** what is missing + the one action that fixes it ("No customers yet — Add customer").
- **Error:** what failed + a retry path. Never `console.error` alone.

---

## 5. Navigation

### 5.1 Web

- Desktop: persistent left sidebar (Dashboard, Customers, Collection, Settings).
- Mobile web: bottom bar, **≤5 items** with text labels, plus a profile sheet.
- Bottom bar must clear the iOS home indicator → `padding-bottom: env(safe-area-inset-bottom)`.
- Active state is color + `aria-current="page"` + a shape cue (underline/dot), not color alone.

### 5.2 Mobile

- Exactly 5 tabs: **Home · Ledger · Collection · Customers · Profile**.
- Tab bar height = 56 + `insets.bottom`; do not hardcode `height` — let React Navigation size it
  so the label is never clipped.
- Tab label uses Mukta (set `fontFamily` explicitly, it does not inherit).
- Active tint = `brand.primary` `#EA580C` (no off-token oranges).

### 5.3 Shared

- Every screen has a predictable back: hardware back (Android) and the header back affordance
  must both pop the stack.
- A signed-in user always lands on the same screen. Pick one route and use it in the auth
  callback, the auth guard, and the login screen.
- Deep-link resolvers for `/` and for every list route.

---

## 6. Motion

- Subtle by default: 120–200ms for press feedback, 200–300ms for entrances.
- `cubic-bezier(0.4, 0, 0.2, 1)` / `power1.out`. Do not animate `width`/`height` — animate
  `transform` and `opacity`.
- Exit animations finish **faster** than entrances (≈0.75×).
- Respect `prefers-reduced-motion` on web and `AccessibilityInfo.isReduceMotionEnabled` on
  native. Reduced motion means: no transforms, keep opacity fades under 100ms, or none at all.
- No scroll-reveal on content that a screen reader or crawler needs — the app is not a landing page.

---

## 7. Accessibility contract (non-negotiable)

1. Contrast ≥ 4.5:1 body, ≥ 3:1 large text and UI borders.
2. Every icon-only control has an accessible name.
3. Every input has a **visible** label plus an accessibility label.
4. Focus is visible everywhere; focus rings are never removed. Dialogs trap focus, restore it on
   close, and are dismissible with `Esc`.
5. Touch targets ≥ 44×44 on touch, ≥ 8px apart.
6. Async state (sync status, errors, results count) is announced through a live region.
7. No information conveyed by color alone — pair every color with text, sign, or icon.
8. Content is reachable at 200% text zoom / large system font without clipping or overlap.
9. Forms: errors adjacent, announced, and focusable.
10. Charts: legend with text, non-color series differentiation, and a data-table or summary fallback.

---

## 8. Anti-patterns — never ship these

| ❌ | Why |
|---|---|
| Green for "money received" **and** for selection / success / online | destroys the money semantics |
| Red for money received | money coming in is not an error |
| Blue or purple accents anywhere | second brand hue |
| Hover-only row actions | unreachable on touch and by keyboard |
| Icon-only buttons with no accessible name | screen-reader dead zones |
| Placeholder-as-label | disappears on focus, fails WCAG 3.3.2 |
| Silent `console.error` instead of an error state | the user thinks it saved |
| Silent validation `return` with no message | the tap appears to do nothing |
| Hardcoded hex in a component | bypasses the token system and dark mode |
| Shadow on a dark surface | muddies the neutral hierarchy |
| Emoji as icons | inconsistent across platforms; use SVG / Ionicons |
| White content card on a dark surface | breaks the neutral hierarchy |
| Text under 12px on web | below legibility floor |
| One duration for every transition | motion stops conveying meaning |
| Mixing icon libraries (lucide + react-icons + hugeicons) | inconsistent stroke, weight, and grid |

---

## 9. Pre-delivery checklist

**Color & tokens**
- [ ] No raw hex in components — tokens only
- [ ] Brand ramp identical on web and mobile
- [ ] Emerald only on money received; credit given is neutral
- [ ] Contrast verified for every new pair in both themes
- [ ] Charts use theme-aware tokens, not hardcoded light/dark rgba

**Type**
- [ ] `tabular-nums` on every amount
- [ ] No text below 12px on web; 11px only for uppercase ledger labels
- [ ] One font family per platform; Devanagari-capable font for names
- [ ] Line height ≥ 1.45

**Layout & interaction**
- [ ] One primary action per screen; one hero number per screen
- [ ] Touch targets ≥ 44px; row actions visible without hover
- [ ] Safe-area insets respected (web bottom bar, native top/bottom)
- [ ] Keyboard avoidance + scrollable form on every input screen
- [ ] No horizontal scroll at 360px; works at 375 / 768 / 1024 / 1440

**States**
- [ ] Skeleton reserves layout height
- [ ] Empty state names the next action
- [ ] Error state explains and offers a retry
- [ ] Submit shows loading → success → error

**Accessibility**
- [ ] Icon-only controls named
- [ ] Visible labels on all inputs
- [ ] Focus visible, trapped in dialogs, restored on close
- [ ] Live region for async status
- [ ] `prefers-reduced-motion` respected

---

## 10. Deviations from the generated template (and why)

The skill's design-system search returned a generic *"Enterprise Gateway"* pattern — corporate
navy/grey palette, green accent, IBM Plex Sans, mega-menu landing page with a "Contact Sales"
CTA. That result was **rejected** for this product:

| Generated | Adopted | Reason |
|---|---|---|
| Corporate navy `#0F172A` + green `#22C55E` | Brand orange `#EA580C` + emerald reserved for money received | Ledger-X is a shopkeeper's tool, not a bank; orange is the shipped brand; green must keep its single meaning |
| "Enterprise Gateway" landing pattern | App-shell pattern: Dashboard → Customers → Customer detail → Statement → Collection | Auth is Google-only, there is no sales funnel; there is no marketing site |
| IBM Plex Sans everywhere | Mukta (web + mobile) + JetBrains Mono / IBM Plex Mono | The product renders Devanagari customer names. Source Sans 3 was the first web choice but `next/font` ships it without a Devanagari subset, so it was replaced by Mukta — the family mobile already uses |
| Scroll-reveal GSAP choreography | 120–200ms press/enter transitions | A shop counter is not a marketing site; motion must not delay a number |
| "Light mode not recommended" | Mobile dark-only (contract), web dark default + working light theme | Mobile contract is explicit; web light tokens exist and must actually work |

**Resolved decision (implemented in `audit-ui-ux-and-generate-artifacts`):** the web `--primary`
token pointed at green while the mobile brand is orange, and the web brand tokens were not declared
at all. The shipped resolution: `--primary` = `--brand-fill` (`#C2410C`, white labels at 5.2:1),
`--brand` = `#EA580C` for identity, and a separate `--positive` emerald token that is used only for
money received. See `docs/ui-ux-audit.md` §2.1.
