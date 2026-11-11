# Design

## Context

See `proposal.md` for motivation and `specs/web-visual-system/spec.md` +
`specs/mobile-visual-system/spec.md` for the behavior contracts. This section records only the
current-state facts that shape the approach.

- **Two clients, two token systems.** Web is Next.js 16 + Tailwind v4 (`@theme inline` over CSS
  custom properties in `apps/web/app/globals.css`); mobile is Expo 58 + NativeWind v4 over
  Tailwind 3 (`apps/app/tailwind.config.js`). They already disagree: mobile's brand is orange
  `#EA580C`, web's `--primary` is green `oklch(0.527 0.154 150.069)`.
- **The web brand tokens do not exist.** `--brand` / `--brand-light` are referenced by
  `.bg-gradient-brand` and `.text-gradient-primary` (`globals.css:160,166`) and by Tailwind
  opacity modifiers (`bg-brand/10`, `border-brand/30`) but are declared nowhere. The compiled
  stylesheet contains four `var(--brand…)` usages and zero declarations. Because the compiled
  `.bg-gradient-brand` rule (offset 186256) comes after `.bg-primary` (37379) and uses the
  `background` shorthand, it wins and resolves to `transparent`.
- **Five more web utilities are used but undefined**: `.tabular` (the real Tailwind class is
  `tabular-nums`), `.chip-receivable` / `.chip-payable` / `.chip-settled`,
  `.card-hover`, `.fade-up`, `.safe-area-bottom`. None appear in the compiled output.
- **`:root` declares `--card`, `--primary`, `--radius` … but not `--background` or
  `--foreground`** — those exist only inside `.dark`, so `bg-background` / `text-foreground` are
  undefined in the light theme.
- **Web money rendering is duplicated and inconsistent.** `formatCurrency` is copy-pasted in five
  files; `TransactionItem.tsx:130` colors by `isCredit` only, so a payment (a debit with a payment
  method, per `lib/payments.ts:21-26`) renders red; the dashboard colors Credit `#22C55E` and Paid
  `#EF4444`; `dashboard/page.tsx:181` calls `Math.abs` in the tooltip, erasing the sign.
- **Web charts bypass the shipped wrapper.** `components/ui/chart.tsx` (shadcn `ChartContainer`
  with `ChartConfig` theming) has zero importers; the three dashboard charts use raw recharts with
  literal hex colors, a white-only grid stroke, and no legend text for the "By Type" chart.
- **Web forms are gated by `isValid` without a mode.** `CustomerDialog.tsx:36` creates `useForm`
  with a zod resolver and no `mode` (default `onSubmit`); `CustomerDialog.tsx:135` disables submit
  while `!form.formState.isValid`. RHF computes `isValid` on change but never writes the errors
  into `formState.errors`, and the user can never reach a submit that would populate them, so no
  field error is ever rendered.
- **Mobile Home is the pre-refresh screen.** `app/(tabs)/home.tsx:168` paints the tab
  `bg-brand-primary` and puts `bg-white` cards at `:218`, `:337`, `:432`. The aging strip
  (`components/AgingStrip.tsx:18-22`) fills `#737373` / `#FB7185` / `#E11D48`; against `#EA580C`
  those measure 0.75:1, 1.32:1, and 0.75:1. The legend on Home uses a third, different set of
  colors, and the shared `AgingLegend` component that matches the strip is imported nowhere.
- **Mobile literals dominate.** ~380 hardcoded hex values across 26 screens; `lib/theme.ts` — the
  canonical runtime palette — has zero importers; `brand-dark` / `brand-card` / `brand-border` /
  `brand-muted` / `brand-surface` legacy aliases coexist with the current tokens.
- **Mobile state is instantiated repeatedly.** `useAuth()` runs in 5 components, `useSettings()`
  in 3, `useOfflineQueue()` in 3. Each queue instance calls `initQueue()` and each fires
  `processQueue()` on reconnect (`hooks/useOfflineQueue.ts:78-83`), so three FIFO replays can race
  the same rows to the API.
- **The in-flight `refine-mobile-ux-and-visual-system` change is 36/37 tasks complete** while the
  audited code still violates several of its completed tasks (Home surfaces, the contrast sweep in
  8.3, pressed states in 8.4). Its only open task is 8.6 — the screenshot verification that would
  have caught this. This change must therefore verify behavior, not trust task checkmarks.
- **Verification tooling.** The web app can be screenshotted locally; the mobile app has an Expo
  dev client and an EAS preview profile (`docs/mobile-visual-system.md` task 8.6 was left open for
  exactly this). No browser automation is wired into CI; the repo's gates are `bun run lint`,
  `bun run typecheck`, and `bun run test`.

## Goals / Non-Goals

**Goals:**

- One brand ramp, one money-color rule, one type scale, and one set of component treatments
  implemented identically on both clients, sourced from `design-system/ledger-x/MASTER.md`.
- Every declared token resolves to a real value in both themes; no utility class in the source is
  undefined.
- Money direction readable at a glance and identically on both clients, carried by sign, label and
  position as well as color.
- Every control named, reachable, and 44pt on touch; every async state announced; every chart
  named and given a text fallback.
- Screens that tell the truth about loading, empty, error and offline state.
- A verification gate that would have caught the defects this change fixes: contrast measurements,
  token-resolution checks, and a screenshot matrix for both clients.

**Non-Goals:**

- No API, database, schema, auth-flow, or offline-queue format change. No new runtime dependency
  on either client.
- No new fonts. Web already loads Source Sans 3 and JetBrains Mono; mobile already ships Mukta and
  IBM Plex Mono.
- No theme-toggle UI and no theme-preference persistence. The light theme is repaired so it is not
  broken; dark stays the default and the toggle is a separate change.
- No marketing or landing page work, and no change to the print stylesheet beyond keeping it
  working after token changes.
- No restructuring of the five-tab information architecture, no new screens, and no change to the
  ledger's scope disclosure ("recent activity · last 5").
- No archive of the in-flight `refine-mobile-ux-and-visual-system` or
  `mobile-five-screen-ui-refresh` changes; this change does not rewrite them.

## Decisions

### 1. The web brand ramp is declared once, in CSS, and `--primary` points at it

`apps/web/app/globals.css` gains the brand ramp as CSS custom properties plus matching
`@theme inline` entries:

```css
@theme inline {
  --color-brand: var(--brand);
  --color-brand-fill: var(--brand-fill);
  --color-brand-text: var(--brand-text);
  --color-positive: var(--positive);
}
:root, .dark { --brand: #EA580C; --brand-light: #FB923C; --brand-fill: #C2410C;
                --brand-text: #FB923C; --positive: #34D399; }
```

`--primary` is re-pointed at `var(--brand)` so every shadcn `bg-primary` / `text-primary-foreground`
becomes the brand orange, and a separate `--positive` carries emerald for money received.

*Alternative considered:* keep `--primary` green and only declare the missing brand tokens. Rejected:
it leaves green as the app's dominant accent, which is exactly the collision the mobile contract
avoids, and it keeps two unrelated "action" colors on web (green `--primary` plus orange
`--brand`) for no reason.

*Trade-off:* this repaints every web surface. Mitigated by making it one isolated CSS commit at the
front of the sequence, so it can be reverted on its own.

### 2. Undefined utilities are either defined or deleted — never left dangling

- `.tabular` → replaced by Tailwind's `tabular-nums` at every usage. A custom alias would create a
  second name for a built-in and hide the difference in review.
- `.chip-receivable` / `.chip-payable` / `.chip-settled` → replaced by the existing `Badge`
  primitive with token-driven variants. Defining three bespoke pill classes for one screen is not
  worth a stylesheet.
- `.card-hover` → defined as a single shared hover treatment, or removed where the card is not
  interactive.
- `.fade-up` → defined as a short opacity/transform entrance that respects reduced motion, or
  removed. It is decorative, so removal is the default.
- `.safe-area-bottom` → defined as `padding-bottom: env(safe-area-inset-bottom)`.

*Alternative considered:* define every missing utility to preserve the current markup. Rejected for
the chips (the `Badge` primitive already exists) and for `tabular` (built-in class), accepted for
`safe-area-bottom` (no equivalent exists).

### 3. Money color is decided in one shared helper per client

Web gains `apps/web/lib/money.ts` exposing a single mapping from a transaction to its presentation:
`{ tone: "credit" | "paid" | "neutral" | "overdue", sign: "+" | "−" | "", label }`. Every consumer —
`TransactionItem`, the statement view, the collection rows, the dashboard tiles and the chart
config — asks that helper instead of branching on `type` itself. Amount formatting moves to one
`formatCurrency` in `apps/web/lib/format.ts`, replacing the five copies.

Mobile gains the equivalent in `apps/app/lib/theme.ts`, which becomes the single runtime source
(replacing the zero-import file of the same name) and exports named colors, spacing, radius and
type-scale constants for the `StyleSheet` entries that cannot use class names.

*Alternative considered:* keep the per-component conditionals and only swap the hex values.
Rejected: the defect is a *decision* made in five places, not a color value; without a shared
decision the semantics drift again on the next feature.

### 4. Charts adopt the shipped `ChartContainer` wrapper and gain a text fallback

`components/ui/chart.tsx` is adopted as the single entry point for the three dashboard charts. Its
`ChartConfig` gives per-series token colors (`var(--color-<key>)`), so the credit and paid series
are theme-aware and never literal hex. Credit uses a neutral warm tone, paid uses `--positive`, and
the two series additionally differ in fill pattern and direct legend text so hue is not the only
distinction. Each chart panel renders a one-sentence trend summary and, on the 12-month panel, a
scrollable data table.

*Alternative considered:* keep raw recharts and bolt on `aria-label`, legends and a table. Rejected:
it leaves three different tooltip implementations and no shared token wiring; the wrapper already
exists, is maintained with the rest of the shadcn components, and removes the `any`-typed custom
tooltips at `dashboard/page.tsx:175,188`.

*Note:* `ChartContainer` renders a `div` with a `role="img"` and an `aria-label` derived from the
config, which satisfies the accessible-name requirement; the visible summary and table remain
necessary because the wrapper does not provide a data table.

### 5. The light theme is repaired, and the dark theme stays the default

`:root` gains `--background` and `--foreground` (plus any other token the `.dark` block declares
that `:root` lacks), so `bg-background` / `text-foreground` resolve in both themes, and the
contrast failures for `text-emerald-400` / `text-amber-400` / `text-red-400` on white are fixed by
using the 500/600 steps in the light theme and the 400 steps in the dark theme — theme-aware token
pairs rather than one literal for both themes.

`defaultTheme="dark"` and `enableSystem={false}` stay as they are.

*Alternative considered:* delete the light palette and ship dark-only. Rejected: it removes the
`next-themes` dependency's purpose and leaves a day-use desktop app unusable in bright light;
repairing it is a handful of token declarations.

### 6. Mobile Home is rebuilt on the existing dark primitives

Home adopts `ScreenContainer` (gutter corrected to 20), `SectionHeader`, `AgingStrip`, `MoneyText`
and `Button` instead of hand-rolled views. `AgingLegend` becomes the single legend component, used
by both the strip and the top-debtors list, so the strip and its legend cannot disagree. `MetricCard`
— the unused component that implements the banned white-metric-card pattern — is deleted rather than
restyled.

*Alternative considered:* hand-fix the existing Home markup in place. Rejected: the screen already
diverges from every shared primitive, so the drift will recur; adopting the primitives is what makes
the contract enforceable.

### 7. Mobile literal colors are migrated per screen, with a mechanical check

The migration is done screen by screen in the order of the tasks, replacing hex literals with
token-backed constants. A repo check (a script under `apps/app/scripts/` or a repo-root script)
fails when a forbidden literal appears in the app sources: the blue family, the non-token greys
(`#525252`, `#737373` where it is used as text, `#666`, `#777`, `#888`, …), and the emerald/amber
values used outside the money role.

*Alternative considered:* a one-shot codemod across all 26 screens. Rejected: it produces an
unreviewable diff; per-screen migration keeps each step verifiable by screenshot and by the
existing unit tests. *Trade-off:* the check has to allow the token definitions themselves and any
legitimate non-text use, so the script keeps a small allow-list that is reviewed when it is added.

### 8. Press feedback and reduced motion are implemented once, with Reanimated

NativeWind's `active:` variant applies instantly, and `react-native-reanimated` (already a
dependency, currently never imported) is the only way to honor the contract's 120ms pressed
transition and reduced-motion rule. A shared pressable-style helper applies 0.8 opacity plus a
darker fill over 120ms and collapses the transition when
`AccessibilityInfo.isReduceMotionEnabled()` is true.

*Alternative considered:* accept instant `active:` states. Rejected: the contract explicitly requires
a visible pressed state and reduced-motion support, and `active:opacity-80` without a transition is
what the audit found missing on 20+ pressables.

### 9. Session, settings, and the offline queue become root providers

Three providers are mounted once in `apps/app/app/_layout.tsx`: a session provider around the
Better Auth client, a settings provider around the `/settings` fetch and its mutation, and an
offline-queue provider that owns `initQueue()` and `processQueue()`. The existing hooks keep their
call sites — they read from context instead of constructing their own client — so screens do not
change shape.

*Alternative considered:* module-level singletons for the queue client. Rejected: a singleton
cannot be reset between app restarts or torn down in tests, and it hides the lifecycle from the
component tree.

*Trade-off:* the providers change when the session resolves. The auth guard must wait for the
session to resolve before redirecting, otherwise a sign-out can bounce back into the app — the
defect the audit found in `components/AuthGuard.tsx:31-33`.

### 10. The landing route is a single shared constant per client

Web uses `/dashboard`; mobile uses `/(tabs)/home`. Both the auth callback and the auth guard import
the same constant, so a signed-in user always lands in the same place.

### 11. Verification is a scripted gate, not a checklist

Three checks run locally and are recorded in the change:

1. **Token resolution** — a script parses `apps/web/app/globals.css` and the compiled stylesheet
   and fails when a referenced custom property or a used custom utility class has no declaration.
2. **Contrast** — a script computes WCAG ratios for the token pairs the contract names, so the
   orange, emerald, rose and muted steps are measured rather than eyeballed.
3. **Screenshots** — a matrix of both clients (web: login, dashboard, customers, customer detail,
   statement, collection, settings, plus a 360px pass; mobile: launch, the five tabs, add/edit
   customer, statement, app lock) in loaded, empty and offline states, reviewed against the
   specs. This is the task the earlier change left open, and the gate that would have caught the
   Home defect.

## Risks / Trade-offs

- **[The web re-theme changes every surface at once]** → Land it as an isolated CSS commit first,
  screenshot the whole app immediately after, and keep it revertable on its own.
- **[Migrating ~380 mobile hex literals touches 26 screens]** → Migrate screen by screen with a
  screenshot and `bun run test` after each; keep the shared primitives' public behavior unchanged so
  screen migrations are presentation-only.
- **[Consolidating the queue provider changes write ordering]** → Preserve strict FIFO and the
  device-generated idempotency keys; add or extend tests that assert a queued item is replayed once
  when three screens are mounted simultaneously.
- **[Consolidating the session provider changes auth timing]** → The guard waits for session
  resolution before redirecting; verify sign-out, cold start, and token expiry by hand.
- **[Fixing the light theme changes appearance for anyone already on light]** → Dark remains the
  default and `enableSystem` stays off, so the default population sees no change.
- **[Enabling the `tabular-nums` fix changes column widths]** → Amount columns may widen by a few
  pixels; re-check the customer grid, collection rows and statement table at 360px.
- **[Raising the web text floor from 9–11px to 12px changes dense layouts]** → Expect the dashboard
  tiles and collection rows to grow slightly; verify no clipping in the chart legends and stat tiles.
- **[The earlier change's task checkmarks are not trustworthy]** → Verify behavior in this change
  rather than assuming completion, and re-run its unverified screenshot gate here.

## Migration Plan

No data migration and no API change. The work is a sequence of independently revertable steps:

1. **Web token layer** — declare the brand ramp, repair `:root`, fix the missing utilities. One
   commit; screenshot the web app immediately.
2. **Web money semantics and charts** — shared money helper, chart wrapper, legends, summaries,
   tooltips.
3. **Web accessibility, forms, and states** — reachable actions, named controls, visible
   validation, honest empty/error states, route boundaries, small-screen and safe-area fixes.
4. **Mobile Home re-base** — dark surfaces, one hero, one aging color map, accessible labels.
5. **Mobile literal purge and accessibility sweep** — per screen; shared pressable style; live
   regions; 44pt targets.
6. **Mobile shared state providers** — session, settings, offline queue; guard waits for session.
7. **Verification** — token-resolution check, contrast check, screenshot matrix on both clients.

**Rollback:** each step is a separate commit with no persisted state, so a step can be reverted
without data repair. The web token step is the only one that changes what most users see; it is
first and revertable alone.

## Open Questions

- Whether a user-facing theme toggle and theme preference belong in a later change. The tokens are
  repaired either way and the default does not change, so this does not affect the specs or the
  task breakdown.
- Whether the orphaned web components (`forgot-password/*`, `reset-password/*`, `signup/LogoSection`,
  `customers/CustomerHeader`, the duplicated `hooks/useMobile.ts`) should be deleted in this change
  or in a separate cleanup. They are unused today; this change removes them only where it already
  touches the file.
