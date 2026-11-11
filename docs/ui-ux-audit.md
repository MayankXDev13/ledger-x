# Ledger-X — UI/UX & accessibility audit

Audit date: 2026-11-10
Scope: `apps/web` (Next.js 16 · Tailwind v4 · shadcn/radix · recharts) and `apps/app` (Expo 58 · RN 0.88 · NativeWind v4)
Method: full static read of every screen, component and token file in both clients, checked against
`design-system/ledger-x/MASTER.md`, `docs/mobile-visual-system.md`, WCAG 2.2 AA and the
ui-ux-pro-max rule set (accessibility → touch → performance → style → layout → type → motion →
forms → navigation → charts). Token claims were verified against the source **and** the compiled
stylesheet (`apps/web/out/_next/static/chunks/*.css`) and the installed Tailwind/RHF packages.

Companion artifacts: `design-system/ledger-x/MASTER.md`, `design-system/ledger-x/pages/*.md`.

Severity: **P0** ships broken / blocks the task · **P1** breaks a rule the product contract states
explicitly · **P2** measurable UX or a11y defect · **P3** polish and consistency.

---

## 1. Executive summary

| Area | P0 | P1 | P2 | P3 |
|---|---|---|---|---|
| Web — tokens & color | 3 | 2 | 2 | 2 |
| Web — money semantics | 1 | 1 | 2 | 1 |
| Web — charts & data display | 1 | 2 | 3 | 1 |
| Web — accessibility & interaction | 2 | 4 | 5 | 1 |
| Web — forms, states, layout | 1 | 3 | 4 | 1 |
| Mobile — visual contract | 1 | 3 | 3 | 1 |
| Mobile — money semantics & color | 1 | 2 | 2 | 1 |
| Mobile — accessibility & touch | 2 | 3 | 4 | 1 |
| Mobile — forms, states, platform | 2 | 3 | 4 | 2 |
| Cross-platform | — | 2 | 2 | 1 |

**The three findings that matter most:**

1. **The web app has no working brand color.** `--brand` / `--brand-light` are used by ~24
   components and defined nowhere, so every primary CTA, logo tile and avatar — including the
   whole login/signup brand panel — renders with **no background**. Near-white label text on a
   transparent fill: invisible on the light theme, shape-less on the dark theme.
2. **The money model is inverted on both clients.** On web a *received payment* is painted **red**
   (`TransactionItem.tsx:130`); on mobile *credit given* is painted **emerald** and a *received
   payment* is painted **amber**. In a ledger, "this money arrived" vs "this money is owed" is the
   only distinction that matters, and neither client gets it right.
3. **The mobile Home tab still ships the pre-refresh design** — an orange page with white content
   cards, against a contract that says `#0A0A0A` background, `#171717` surfaces and *no white
   content cards*. The signature aging strip is drawn on orange in colours that sit at
   **0.75:1 – 1.32:1** — effectively invisible.

---

## 2. P0 findings

### 2.1 Web — the brand color layer does not exist

`apps/web/app/globals.css:160,166`

```css
.bg-gradient-brand { background: linear-gradient(to right, var(--brand), var(--brand-light)); }
.text-gradient-primary { background: linear-gradient(to right, var(--brand), var(--brand-light)); … }
```

`--brand` and `--brand-light` are **never defined** anywhere in the repo (verified across
`apps/web/app`, `apps/web/components`, `apps/web/lib`, the committed build output
`apps/web/out/_next/static/chunks/0janerkzfb8fm.css` and `apps/web/.next/dev/...css` — only
*usages* exist, never a declaration). A `var()` with no fallback is invalid at computed-value
time, so the entire `background` shorthand resolves to `transparent` / `none`.

Compiled-CSS order proves the gradient beats the shadcn primary: `.bg-primary{` is emitted at
offset **37379**, `.bg-gradient-brand{` at **186256**, and the `background` shorthand in the
gradient wipes the `background-color` set by `.bg-primary`.

That utility is the **only** background on:

| Call sites | What breaks |
|---|---|
| `app/(app)/customers/page.tsx:81` | mobile "Add Customer" CTA |
| `app/(app)/customers/detail/CustomerDetailView.tsx:184,226` | "Record Payment" / primary CTA |
| `app/(app)/dashboard/page.tsx:234,263` | dashboard logo tile + primary CTA |
| `app/(app)/collection/page.tsx:117,244` | logo tile + "Add a customer" |
| `app/(app)/settings/page.tsx:199`, `customers/statement/StatementView.tsx:96` | primary actions |
| `components/customers/CustomersHeader.tsx:13,29`, `CustomerHeader.tsx:27`, `EmptyCustomers.tsx:35,50`, `CustomerDialog.tsx:136`, `CustomerProfileHeader.tsx:209` | headers, avatars, dialog CTA, empty state |
| `components/login/BrandPanel.tsx:7`, `signup/LogoSection.tsx:15`, `forgot-password/LogoSection.tsx:19`, `reset-password/LogoSection.tsx:15` | **the entire login and signup brand panel has no background** |
| `components/onboarding/OnboardingFlow.tsx:161,171`, `transactions/EmptyTransactions.tsx:21,37`, `AppSidebar.tsx:250,269`, `MobileBottomNav.tsx:138` | onboarding, empty states, avatars |

Every one of them also sets `text-primary-foreground` (near-white). On a white card that is
**white text on white**. On the dark theme the CTA is a shape-less white text blob.

The same hole exists in the Tailwind color layer: `bg-brand/10`, `border-brand/30`,
`bg-brand-light/8` (`components/login/BrandPanel.tsx:21,22,66,67,68`),
`bg-brand/15`, `text-brand-light`, `from-brand to-brand-light`
(`components/customers/CustomerAnalyticsCards.tsx:106-107`,
`CustomerProfileHeader.tsx:47-52,179`, `CustomerCard.tsx:12`) require a `--color-brand` theme
variable that is **not** declared in `@theme inline` (`globals.css:7-49`) → they compile to
nothing. `text-brand-light` resolving to nothing means the "Net Balance" figure has no
distinguishing colour at all.

**Fix:** declare the brand ramp and point `--primary` at it.

```css
@theme inline {
  --color-brand: var(--brand);
  --color-brand-fill: var(--brand-fill);
  --color-brand-text: var(--brand-text);
  --color-positive: var(--positive);
}
:root, .dark {
  --brand: #EA580C; --brand-light: #FB923C; --brand-fill: #C2410C;
  --brand-text: #FB923C; --positive: #34D399;
}
```

> **Decision required.** `--primary` is currently **green** (`oklch(0.527 0.154 150.069)`,
> `globals.css:57,63`) while the mobile brand is orange. Green as the UI accent also collides
> with "emerald means money received". Recommendation: `--primary` → brand orange, and a separate
> `--positive` emerald used only for received money. This changes every web surface — needs
> sign-off.

### 2.2 Web — the light theme is structurally broken

`globals.css:52-83` (`:root`) defines `--card`, `--popover`, `--primary`, `--muted`, `--border`,
`--ring`, `--chart-*`, `--sidebar-*` … but **not** `--background` or `--foreground`. Those two are
only declared inside `.dark` (`globals.css:87-88`), while `@theme inline` maps
`--color-background: var(--background)` / `--color-foreground: var(--foreground)`.

Consequence in light mode: `body { @apply bg-background text-foreground }` resolves to a
transparent background and inherited (UA default) text colour, and every `bg-background` /
`text-foreground` utility across the app is undefined. The light palette is also unreachable in
practice — `ThemeProvider` is `defaultTheme="dark" enableSystem={false}` and **no UI anywhere
calls `setTheme`**, so the light token set can only be reached by hand-editing localStorage.

### 2.3 Web — a received payment is rendered red

`apps/web/components/transactions/TransactionItem.tsx:127-135`

```tsx
className={cn("text-base font-bold tabular", isCredit ? "text-emerald-400" : "text-red-400")}
{isCredit ? "+" : "−"}{formatCurrency(transaction.amount)}
```

`isPaymentEntry()` (`lib/payments.ts:21-26`) defines a payment as `type === "debit"` **and** a
payment method — so a recorded payment falls into the `else` branch and is painted **red**
while the badge on the same row says "Payment · Cash".

The mobile contract states the opposite rule:

> Payment received → `positive` with a `−` sign · Credit given → `ink` with a `+` sign

So on web money received = red and money lent = green; on mobile money received = amber and money
lent = emerald. **Both clients invert the one meaning that matters most in a ledger.**

Same line: `tabular` is **not a Tailwind class**. Tailwind v4's font-variant utilities are
`proportional-nums`, `tabular-nums`, `slashed-zero` (verified in
`apps/web/node_modules/tailwindcss@4.3.5/dist`). `tabular` compiles to nothing, so **no amount
anywhere on web uses tabular numerals** — `dashboard/page.tsx:147,583,718`,
`collection/page.tsx:166,278`, `StatementView.tsx:207-226`, `CustomerAnalyticsCards.tsx:63`.

### 2.4 Web — row actions exist only on hover

`apps/web/components/transactions/TransactionItem.tsx:138` and
`apps/web/components/customers/CustomerCard.tsx:67`

```tsx
<div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all duration-150 translate-x-1 group-hover:translate-x-0">
```

Edit and delete are `opacity-0` until hover. Touch devices have no hover → **edit and delete are
unreachable on mobile web**. Keyboard users can tab into them (opacity does not remove them from
the tab order) but see nothing — a WCAG 2.4.7 / 2.4.11 failure. The buttons are also `w-7 h-7` =
**28px**, below the 44px touch target and below the 24px WCAG 2.5.8 desktop minimum.

### 2.5 Web — five custom utilities are used but never defined

Verified absent from `globals.css` and from the compiled stylesheet:

| Utility | Used at | Effect of it being missing |
|---|---|---|
| `.tabular` | dashboard `:147,583,718`, collection `:166,278`, statement `:207-226`, analytics `:63` | no tabular numerals on any money column |
| `.chip-receivable` / `.chip-payable` / `.chip-settled` | `components/customers/CustomerProfileHeader.tsx:133-136` | the Receivable / Payable / Settled pill renders as **unstyled bare text** |
| `.card-hover` | `dashboard/page.tsx:229` | no hover affordance on cards |
| `.fade-up` | `dashboard/page.tsx:115`, `customers/page.tsx:37`, `settings/page.tsx:130`, `collection/page.tsx:102` | no entry animation |
| `.safe-area-bottom` | `components/MobileBottomNav.tsx:60` | **the mobile bottom nav sits under the iOS home indicator** |

### 2.6 Web — validation errors can never be shown

`components/customers/CustomerDialog.tsx:36-39,135`

```tsx
const form = useForm({ resolver: zodResolver(customerSchema), defaultValues: customer || { name: "", phone: "" } });
…
<Button disabled={loading || !form.formState.isValid}>
```

`useForm` is created with **no `mode`**, so react-hook-form defaults to `mode: "onSubmit"`.
`formState.isValid` is tracked (the component reads it), so RHF does recompute validity on every
keystroke — but `_setValid()` only checks whether the resolver produced errors; it never writes
them into `formState.errors`. Because the submit button is disabled until the form *is* valid,
the user can never submit, so `onSubmit` validation never fires and **no field error is ever
rendered**. The visible result: a permanently greyed-out "Add Customer" button with no
explanation of what is missing. Same pattern in
`components/transactions/TransactionDialog.tsx:65,292`.

**Fix:** keep the button enabled, set `mode: "onBlur"`, and render the error next to the field.

### 2.7 Mobile — Home is still the pre-refresh design

`apps/app/app/(tabs)/home.tsx:168` renders `<View className="flex-1 bg-brand-primary">` — the whole
Home tab is an orange page — and then puts **white cards** on it (`:218`, `:337`, `:432`).

The contract (`docs/mobile-visual-system.md`) specifies background `#0A0A0A`, surfaces `#171717`,
and **"no white content cards"**. Every other component (`AgingStrip`, `SectionHeader`,
`MetricCard`, `ScreenContainer`) targets the dark theme; Home uses none of them.

Measured against `#EA580C`:

| Element | Fill | Contrast on orange |
|---|---|---|
| Aging strip 0–30 | `#737373` | **0.75:1** ✗ |
| Aging strip 31–60 | `#FB7185` | **1.32:1** ✗ |
| Aging strip 60+ | `#E11D48` | **0.75:1** ✗ |
| "Add credit" label | `#EA580C` on white | **3.55:1** ✗ |
| "Record payment" label | white on `#EA580C` | **3.55:1** ✗ |
| Greeting `text-white/90` | | **3.14:1** ✗ |
| Meta `text-white/70` | | **2.4:1** ✗ |

The aging strip is the product's signature visualization and it is **invisible**. The contract
itself prescribes the fix — `brand-primaryFill` `#C2410C` (5.2:1) for any small white label on
orange — and the code does not use it.

### 2.8 Mobile — the blue brand survives in six files

Contract: *"Blue and purple are not brand colors. Do not add a third chromatic brand hue."*

| File:line | Snippet |
|---|---|
| `app/customers/add.tsx:136` | `${loading ? "opacity-60" : "bg-blue-500"}` — **primary Save button is blue** |
| `app/customers/edit.tsx:268` | `saveButton: { backgroundColor: "#3B82F6" }` — **primary Save button is blue** |
| `components/EditTransactionModal.tsx:94` | `<Text className="text-blue-500 …">Save</Text>` |
| `components/DeleteConfirmationDialog.tsx:61` | `${isDestructive ? "bg-red-500" : "bg-blue-500"}` |
| `app/customers/details.tsx:217,269,280,385,452` | `color="#3B82F6"` (edit icon, statement icon, link texts) |
| `components/DateFilterDropdown.tsx:39,74,78,81` | `color="#3B82F6"`, `bg-blue-500/10`, `text-blue-500` |

### 2.9 Mobile — emerald is used for things that are not money received

The contract reserves `positive` `#34D399` for *"payments received only"*. It is currently used
for: the Credit action (`app/customers/details.tsx:251,454`), onboarding progress + the Next
button (`components/OnboardingDialog.tsx:94,105,106,123,127,152`), the app-lock Unlock button
(`components/AppLockGate.tsx:169,177,231,260,261`), payment-method selection
(`components/PaymentMethodSelector.tsx:46,57,62`), the quick-entry success check
(`components/QuickEntryModal.tsx:132`) and the statement Share button
(`app/customers/statement.tsx:363`).

Meanwhile **money received is amber** `#F59E0B` (`app/customers/details.tsx:147,456`), and the PDF
stylesheet paints credit green / debit red (`lib/statements.ts:115-116`).

### 2.10 Mobile — customer balance semantics are inverted

`apps/app/app/customers/details.tsx:100-105` says *"You owe ₹X"* when `balance > 0` (the customer
owes **you**) and *"We owe you"* when it is negative. `:399` paints the positive (receivable)
balance **red**, while the contract says an outstanding balance is neutral `ink` and only turns
rose at 60+ days.

### 2.11 Mobile — the offline queue is replayed by three controllers at once

`useOfflineQueue()` is instantiated three times — `app/(tabs)/home.tsx:101`,
`app/(tabs)/customers.tsx:26`, `components/QuickEntryModal.tsx:37`. Each calls `initQueue()` and
each fires `processQueue()` on reconnect (`hooks/useOfflineQueue.ts:78-83`), so **three concurrent
FIFO replays** can push the same rows to the API. `useAuth()` is instantiated 5× and
`useSettings()` 3× — five session round-trips and three `/settings` round-trips per cold start,
with two divergent local copies of the settings state.

---

## 3. P1 findings

### 3.1 Web

| # | Finding | Evidence |
|---|---|---|
| 1 | **Chart series encode money backwards.** 12-Month Trend paints Credit `#22C55E` and Paid `#EF4444`; "By Type" paints credit green / debit red; "Transaction Flow" (all activity) is `#DC2626`. Money that arrived is red, neutral activity is red. | `dashboard/page.tsx:444,521,528,352-353,380,384` |
| 2 | **Charts are color-only.** "By Type" has no legend at all; the 12-month legend is a hand-rolled color-dot row. | `dashboard/page.tsx:440-448, 474-483` |
| 3 | **Charts have zero accessibility.** No `accessibilityLayer`, no `role="img"`/`aria-label`, no `<title>`, no data-table fallback. The shipped `components/ui/chart.tsx` accessible wrapper is **unused**. Keyboard and screen-reader users get nothing from the three chart panels. | `dashboard/page.tsx:339-392,416-449,489-533`; `components/ui/chart.tsx` (0 importers) |
| 4 | **The tooltip destroys the sign.** `formatCurrency(Math.abs(payload[0].value))` — credits are stored positive and debits negative, so a ₹500 credit and a ₹500 debit both show "₹500". | `dashboard/page.tsx:181,223` |
| 5 | **Grid lines are hardcoded white** — invisible on the white light-theme card. | `dashboard/page.tsx:358,423,496` |
| 6 | **Chart tokens are unused and identical in both themes** — `--chart-1…5` are five near-identical purples, byte-identical in `:root` and `.dark`. | `globals.css:69-73,106-110` |
| 7 | **No route-level error boundary or loading UI anywhere** — `find app -name "loading.tsx" -o -name "error.tsx" -o -name "not-found.tsx"` returns **zero** results. | `apps/web/app/` tree |
| 8 | **API failures render as cheerful empty states.** A failed collection request shows "Nothing to collect / Every customer is settled."; a failed customer list shows "No customers yet / Add your first customer"; a failed metrics request shows a permanent "—". | `collection/page.tsx:96,229`; `customers/page.tsx:24-29,61-76`; `dashboard/page.tsx:276` |
| 9 | **Light-theme contrast failures on every money/status colour.** On `--card: white`: `text-emerald-400` ≈1.9:1, `text-amber-400` ≈1.8:1, `text-red-400` ≈2.6:1, `text-emerald-500`/`text-red-500` ≈2.5:1 — all fail 4.5:1. | `dashboard/page.tsx:719-724,155`; `collection/page.tsx:55-57`; `TransactionItem.tsx:113-116,130`; `StatementView.tsx:213,219,277`; `CustomerAnalyticsCards.tsx:107,116,129` |
| 10 | **Smallest web text is 9px.** `text-[9px]`, `text-[10px]`, `text-[11px]` are used for money sub-labels, legends and dates across the dashboard, collection, statement, settings, sidebar and empty states. Web floor is 12px. | `dashboard/page.tsx:575,621`; `collection/page.tsx:269,283,371,374`; `StatementView.tsx:165,192,204,222,235,303`; `settings/page.tsx:264`; `AppSidebar.tsx:159,201` |
| 11 | **`formatCurrency` is duplicated in ≥ 5 web files** — every formatting change must be made five times. | `CustomerProfileHeader.tsx:28`, `CustomerAnalyticsCards.tsx:5`, `CustomerHeader.tsx:6`, `TransactionItem.tsx:19`, `StatementView.tsx:25` |
| 12 | **`--radius: 0`** — every shadcn component renders square-cornered while hand-rolled ones use `rounded-xl`/`rounded-2xl`. Two radius languages in one product. | `globals.css:74` |
| 13 | **Icon-only "⋯" menu with no accessible name.** | `components/customers/CustomerProfileHeader.tsx:226-232` |
| 14 | **Focus ring removed** on the sidebar sign-out button. | `components/AppSidebar.tsx:285` |
| 15 | **Interactive content nested inside an anchor** — two `<button>`s inside a `<Link>`; the `preventDefault` workaround does not fix the AT model. | `components/customers/CustomerCard.tsx:39,68-93` |

### 3.2 Mobile

| # | Finding | Evidence |
|---|---|---|
| 1 | **The aging legend colours disagree with the strip they explain** — legend uses `bg-white`/`bg-[#0A0A0A]`/`bg-[#7F1D1D]`, the strip uses `#737373`/`#FB7185`/`#E11D48`. The shared `AgingLegend` component with the correct colours is imported nowhere. | `app/(tabs)/home.tsx:254-256` vs `components/AgingStrip.tsx:18-22` |
| 2 | **The trend legend disagrees with the trend bars** — legend says "Credit = white, Paid = black" while the bars are orange/black on a white card. | `app/(tabs)/home.tsx:323,329,355,368` |
| 3 | **≈ 380 hardcoded hex values across 26 screens**; `lib/theme.ts` (the canonical runtime palette) is imported **nowhere**. | repo-wide grep |
| 4 | **No `tabular-nums` except in `MoneyText`.** Every other amount renderer omits it. | `app/customers/details.tsx:163,185,235`; `app/customers/statement.tsx:207-258`; `app/ledger/add.tsx:92`; `components/EditTransactionModal.tsx:108` |
| 5 | **30+ pressables with no `accessibilityRole` / `accessibilityLabel`.** | `details.tsx` 7/0, `EditTransactionModal` 5/0, `OnboardingDialog` 4/0, `statement.tsx` 4/0, `add.tsx` 2/0, `ledger/add.tsx` 2/0, `AppLockGate` 2/0, `DeleteConfirmationDialog` 2/0 |
| 6 | **No live region anywhere** — 0 uses of `AccessibilityInfo`, `accessibilityLiveRegion` or `announceForAccessibility`. Sync status, lock errors and QR open/close are silent. | repo-wide grep |
| 7 | **11 touch targets below 44px** — `OfflinePendingBar` Retry/Discard ≈ 26×38, `EditTransactionModal` close 24×24, `details.tsx` edit ≈ 36, `statement.tsx` share 22, `edit.tsx` back 24 with no `hitSlop`, `collection.tsx` customer name 32. | see file list |

---

## 4. P2 findings

### 4.1 Web — accessibility

| Finding | Evidence |
|---|---|
| Search input has an `id` but no `<Label>` and no `aria-label` → placeholder-only labelling | `app/(app)/customers/detail/CustomerDetailView.tsx:157-163` |
| `SelectTrigger` has no accessible name — SR users get a nameless combobox | `CustomerDetailView.tsx:167-179` |
| `<Label>` without `htmlFor`; the Credit/Debit pair is a bare button pair with no `aria-pressed` / `role="radio"` / `role="group"`. (The payment-method toggle group *does* set `aria-pressed` — inconsistent.) | `components/transactions/TransactionDialog.tsx:161,165,178,226` |
| `DialogDescription` replaced by a plain `<p>` → Radix warning and no dialog description for SR users | `components/customers/CustomerDialog.tsx:71-75`; `components/transactions/TransactionDialog.tsx:151-155` |
| No `aria-live` / `role="status"` in any product file — three dashboard queries poll every 30 s and the numbers change silently | `hooks/useDashboard.ts:17,25,33` |
| Two `nav` landmarks, only one named (`aria-label` on the bottom nav, none on the sidebar nav) | `components/AppSidebar.tsx:154`; `components/MobileBottomNav.tsx:55-58` |
| Statement table `<th>` elements have no `scope="col"` | `app/(app)/customers/statement/StatementView.tsx:236-245` |
| UPI settings error is a bare `<p>`; the input has no `aria-invalid` and no `aria-describedby` | `app/(app)/settings/page.tsx:170-179` |
| Disabled "Copy link"/"QR" buttons explain themselves only via `title=`, which is not reliably announced on focus | `app/(app)/collection/page.tsx:292-325` |

### 4.2 Web — forms & feedback

| Finding | Evidence |
|---|---|
| UPI settings are not a `<form>` and the button is not `type="submit"` → Enter does nothing; same for the statement period filter | `app/(app)/settings/page.tsx:164-213`; `StatementView.tsx:104-150` |
| `handleSubmit` has no `try/catch` → an API failure escapes as an unhandled rejection, the dialog stays open with no inline error (the transaction dialog does have one) | `components/customers/CustomerDialog.tsx:41-48` |
| Clearing the amount field yields `NaN` and the user sees "Expected number, received nan" | `components/transactions/TransactionDialog.tsx:209`; `lib/validation.ts:12` |
| Statement period filter accepts `start > end` and silently shows "No transactions in this period." | `StatementView.tsx:129-137` |
| Settings form has no error branch — a failed settings fetch renders empty `upiId`/`payeeName`, and a later Save would overwrite the stored VPA with blanks | `app/(app)/settings/page.tsx:158-162` |
| The dashboard **Refresh** button refetches only 1 of 3 queries and never surfaces `isFetching` | `app/(app)/dashboard/page.tsx:210,254` |

### 4.3 Web — layout & navigation

| Finding | Evidence |
|---|---|
| Nested scroll containers — `h-screen` wrapper + `overflow-y-auto` main + a `min-h-screen` child | `app/(app)/layout.tsx:8,15`; `CustomerDetailView.tsx:88` |
| The statement table is clipped on small screens — 5 columns inside `overflow-hidden` with **no `overflow-x-auto` wrapper** | `StatementView.tsx:232` |
| The collection amount block can overflow horizontally at 320–375 px | `collection/page.tsx:276-289` |
| Duplicate primary action on mobile — the header "Add Customer" and the fixed FAB are both visible below `lg` | `app/(app)/customers/page.tsx:26-33,79-91` |
| Hand-rolled breadcrumbs with a bare `/` separator, no `<nav aria-label="Breadcrumb">`, no `aria-current` — while the shipped `components/ui/breadcrumb.tsx` sits unused | `collection/page.tsx:103-113`; `settings/page.tsx:131-141`; `CustomerDetailView.tsx:92-108`; `StatementView.tsx:71-81` |
| Deleting a customer leaves the detail page on the deleted id and does not invalidate the detail/dashboard queries | `hooks/useCustomers.ts:56-67`; `CustomerDetailView.tsx:262-265` |
| Orphaned routes/components: `app/signup` redirects to `/login`; `forgot-password/*`, `reset-password/*`, `signup/LogoSection.tsx`, `customers/CustomerHeader.tsx` have no importers; `hooks/useMobile.ts` duplicates `hooks/use-mobile.ts` | repo-wide grep |
| "Customer since" renders **today's** month/year for every customer (`new Date().toLocaleDateString(...)` with a "use id-based mock for now" comment) | `components/customers/CustomerProfileHeader.tsx:162` |
| Negative axis labels render as `₹-5k` (no `Math.abs`, unlike the bar formatter at `:437`) | `dashboard/page.tsx:372-374` |
| Search filters the current page (10 rows) while the badge shows the global total — "Showing page 1 of 5 · 40 total" while 2 rows match | `CustomerDetailView.tsx:78-85,146-150,211-219` |
| `useMemo(() => rows.length, [rows])` never caches because `rows = data?.data ?? []` allocates a new array each render | `collection/page.tsx:96-99` |
| Sign conventions are inconsistent — the dashboard and transaction list use `+`/`−`, collection and statement show unsigned amounts with direction carried by colour only | `dashboard/page.tsx:726`; `TransactionItem.tsx:133`; `collection/page.tsx:279`; `StatementView.tsx:207-226` |

### 4.4 Web — performance & consistency

| Finding | Evidence |
|---|---|
| The whole dashboard is a client component that eagerly bundles recharts (no `next/dynamic`) | `dashboard/page.tsx:1,33-45` |
| The full customer list is downloaded to label 5 transactions — O(rows × customers) per render | `dashboard/page.tsx:213,678` |
| `form.watch()` is called 6× during render → every keystroke re-renders the whole dialog | `components/transactions/TransactionDialog.tsx:141,170,183,212,214,295,301` |
| `defaultValues: customer \|\| {…}` registers `id`, `isSample`, `createdAt`… as form values | `components/customers/CustomerDialog.tsx:38` |
| `ReactQueryDevtools` is mounted unconditionally | `components/providers/QueryProvider.tsx:23` |
| Three icon libraries installed; `react-icons/fa` in 5 files, `lucide-react` in 44, `@hugeicons/react` never imported | `package.json:22,27,28` |
| Four fonts loaded, two used — `--font-geist-sans` and `--font-geist-mono` are loaded and never referenced | `app/layout.tsx:2,17-25` |
| Raw `slate` palette in the auth screen instead of the semantic tokens | `components/login/BrandPanel.tsx:33,47,50,56` |
| `focus-visible` treatment is inconsistent — raw `<button>`s in 6 files have no focus-visible styling; one removes it | `collection/page.tsx:132-155`; `AppSidebar.tsx:129,238,285`; `MobileBottomNav.tsx:96`; `TransactionDialog.tsx:165,178,238` |

### 4.5 Mobile — forms, states & platform

| Finding | Evidence |
|---|---|
| Placeholder-only labels on the two UPI fields | `app/(tabs)/profile.tsx:274-288` |
| Silent validation — an invalid amount returns with no message | `components/QuickEntryModal.tsx:87-88`; `components/EditTransactionModal.tsx:52-53` |
| No success feedback after saving a customer or a ledger entry | `app/customers/add.tsx:60`; `app/customers/edit.tsx:85`; `app/ledger/add.tsx:66` |
| No visible error state on Ledger / Customers — `console.error` then "No transactions yet"; `collection.tsx` never renders `error` | `app/(tabs)/ledger.tsx:64-66`; `customers.tsx:48-50` |
| The add-customer form is not scrollable and has no bottom inset → Save/Cancel can be pushed off-screen | `app/customers/add.tsx:70-149` |
| `EditTransactionModal` has a ScrollView but **no KeyboardAvoidingView** | `components/EditTransactionModal.tsx:100` |
| `app/ledger/add.tsx` hardcodes `paddingTop: 60` and never calls `useSafeAreaInsets` | `app/ledger/add.tsx:174` |
| 5 action buttons in one row at 360 px → "Statement"/"WhatsApp" wrap and clip in a fixed 46 px height | `app/customers/details.tsx:246-283` |
| `min-[80px]` is an invalid Tailwind class (should be `min-h-[80px]`) → the note field's min-height is not applied | `components/EditTransactionModal.tsx:183` |
| `accessibilityRole="progressbar"` with no `accessibilityValue` on a 3-segment aging bar → VoiceOver announces an indeterminate progress bar | `components/AgingStrip.tsx:46-50,72-76` |
| `#666` / `#777` labels at 3.0–4.25:1 | `app/customers/details.tsx:490,409,498,488,396`; `app/customers/edit.tsx:297`; `QuickEntryModal.tsx:177,195,216,235`; `EditTransactionModal.tsx:111,139,161,185`; `add.tsx:88,107`; `OfflinePendingBar.tsx:115`; `PaymentMethodSelector.tsx:33` |
| `react-native-reanimated` 4.7.1 is a dependency but never imported → the contract's 120 ms pressed transition and 150 ms underline animation do not exist; every `active:` style is a 0 ms jump | `apps/app/package.json:53`; repo-wide grep |
| `ScreenContainer` (which sets `keyboardShouldPersistTaps="handled"`) is never imported | `components/ScreenContainer.tsx` (0 importers) |
| `MetricCard` — the exact banned white-metric-card pattern — is never imported but still ships | `components/MetricCard.tsx` (0 importers) |
| The tab bar sets an explicit `height`, overriding React Navigation's safe-area sizing → the label can clip | `app/(tabs)/_layout.tsx:17-19` |
| Tab active tint `#FF6A00` is not a token; the tab label has no `fontFamily` → renders in the system face | `app/(tabs)/_layout.tsx:21,23-26` |
| `login.tsx` calls `router.replace()` during render, and redirects to Customers while `AuthGuard` redirects to Home | `app/auth/login.tsx:14-17` vs `components/AuthGuard.tsx:32` |
| `StatusBar style="auto"` on add/edit screens resolves against the *system* theme while the app forces dark → invisible icons | `app/customers/add.tsx:152`; `app/customers/edit.tsx:207`; `app/ledger/add.tsx:161` vs `app.json:6` |
| Off-contract radii: control radius 8, card radius 14 | `add.tsx:86,105`; `edit.tsx:248`; `statement.tsx:304,313`; `ledger/add.tsx:203,228`; `details.tsx:388` |
| Off-contract gutters: `px-6` / `paddingHorizontal: 24` where the gutter is 20 | `add.tsx:74`; `edit.tsx:234`; `ledger/add.tsx:173`; `QuickEntryModal.tsx:149,168,190,205` |
| `elevation: 4` on the balance card — no shadows on dark surfaces | `app/customers/details.tsx:393` |
| The primary button fill in `ledger/add.tsx` is `#ffffff` | `app/ledger/add.tsx:231-233` |
| Legacy alias tokens (`brand-dark`, `brand-card`, `brand-border`, `brand-muted`, `brand-surface`) coexist with the new ones | `QuickEntryModal.tsx:124,145,149,172,205,211,235`; `app/customers/add.tsx:71`; `profile.tsx:425,429`; `home.tsx:301` |
| Tracking drift on the same "ledger label" role: `tracking-[1.2px]`, `[1.5px]`, `[2px]`, `tracking-widest` (the contract says 11/14 uppercase +0.08em) | `ledger.tsx:170,272`; `collection.tsx:296,303`; `login.tsx:40`; `OnboardingDialog.tsx:99` |
| Optimistic-UI gap — a queued offline entry never appears in Home/Customers/Collection until the next focus refetch | `app/(tabs)/home.tsx:113-135`; `customers.tsx:34-59` |
| `offline_queue` rows are never deleted after a successful sync, and `listAll()` scans the whole table on every enqueue/retry/discard | `lib/offline-queue.ts:58-62,117-119` |
| `filteredCustomers` is recomputed on every render (no `useMemo`), unlike `ledger.tsx:92` | `app/(tabs)/customers.tsx:66-69` |

---

## 5. What is done well

**Mobile**
- **The Ledger screen is the reference implementation** — underline filter tabs with counts and
  `accessibilityState={{selected}}`, a day-grouped `SectionList` with sticky headers, an honest
  scope disclosure, inline search with a labelled clear button, and a real empty state that routes
  to Customers.
- **`components/MoneyText.tsx` is correct** — exact contract scale, `tabular-nums` on every
  instance, five semantic tones, `numberOfLines` / `adjustsFontSizeToFit`.
- **`components/Button.tsx` is solid** — four contract variants, `min-h-[48px]`,
  `accessibilityState={{disabled, busy}}`, a spinner that replaces the label while loading.
- **`lib/offline-queue.ts` / `lib/queue-core.ts` are well engineered** — device-generated UUIDs
  for idempotent replay, WAL mode, a `(status, seq)` index, strict FIFO so a customer created
  offline is replayed before its transactions, permanent-vs-transient failure classification, and
  failures that are never silently dropped.
- **`lib/upi.ts` gets the semantics right** — the shop QR omits `am`, the per-customer QR includes
  the amount, with unit tests.
- **`lib/aging.ts` + `components/AgingStrip.tsx`** correctly distinguish proportional rupee
  segments (Home) from categorical buckets (rows), with unit tests for 0/30/31/60/61 days.
- **Profile** has exactly one sign-out control, and account deletion is guarded by a typed
  `DELETE` plus a disabled submit.
- **No emoji-as-icon anywhere on mobile** — Ionicons throughout, consistently.
- **Offline writes never vanish** — retry and discard both surface in the pending bar.

**Web**
- Consistent `aria-label` on nearly all icon-only buttons (`CustomerCard.tsx:77,90`,
  `TransactionItem.tsx:144,153`, `TransactionPagination.tsx:40,59`, `CustomerSearch.tsx:28`,
  `AppSidebar.tsx:138`).
- Real `<table>`/`<thead>`/`<th>` semantics in `StatementView.tsx:233-246` (only `scope` missing),
  plus `thead { display: table-header-group }` for printing.
- Radix primitives give correct focus trapping, Escape handling, focus restore and `sr-only`
  "Close" labels for Dialog/Sheet/AlertDialog.
- `aria-current="page"` on **both** nav surfaces (`AppSidebar.tsx:179`, `MobileBottomNav.tsx:73`).
- Money states are **not** colour-only in the transaction list — `↑ Credit` / `↓ Debit` /
  `Payment · UPI` badges accompany the colours (`TransactionItem.tsx:84-88`).
- Uniform currency formatting via `Intl.NumberFormat("en-IN", INR)`.
- Skeletons rather than spinners on every list/detail surface; `AuthGuard` blocks protected
  content and shows a loading state.
- Toast feedback on every mutation via sonner (which ships an ARIA live region).
- `aria-pressed` correctly applied to the payment-method toggle group (`TransactionDialog.tsx:246`).
- Deletion flows use `AlertDialog` with explicit consequence copy.
- The print stylesheet is well thought out (`globals.css:171-224`) — `@page A4`, chrome removal,
  page-break control, repeating table headers.
- `useAuth` handles the OAuth hash-token round-trip and scrubs the URL.

---

## 6. Recommended fix order

**PR 1 — Unbreak the web token layer (P0).**
Declare `--brand` / `--brand-light` / `--brand-fill` / `--color-brand` / `--positive`; add the
missing `--background` / `--foreground` to `:root`; define `.tabular` → `tabular-nums`,
`.chip-*`, `.card-hover`, `.fade-up`, `.safe-area-bottom` (or delete the usages). Restores ~24
invisible primary CTAs, the login/signup brand panel, the balance pills, the mobile safe area and
tabular numerals. Decide orange-vs-green `--primary` first.

**PR 2 — Correct money semantics on both clients (P0).**
Web: colour the transaction amount by `isPaymentEntry` (paid = `--positive`, credit = neutral ink),
fix the dashboard chart series colours, add legends + a text summary + a data-table fallback, keep
the sign in the tooltip. Mobile: credit = `ink`, paid = `positive`, outstanding = neutral until 60+,
and fix the inverted "You owe / We owe you" copy.

**PR 3 — Mobile Home back on the dark contract (P0).**
`bg` background, `surface` cards, no white cards, the aging strip on `surface`, `brand-fill` for
white labels on orange, one hero number, legends that match their bars.

**PR 4 — Replace the blue/emerald/amber literals on mobile (P0/P1).**
`#3B82F6` / `bg-blue-500` → brand; `#10B981` → brand or `positive` by role; `#F59E0B` on money →
`positive`; import `lib/theme.ts` instead of literals; delete the dead `MetricCard` /
`ScreenContainer` / `AgingLegend` / `DateFilterDropdown` components.

**PR 5 — Accessibility sweep on mobile (P1).**
`accessibilityRole` + `accessibilityLabel` on every pressable, `accessibilityState` on toggles,
live regions for sync/lock/QR, touch targets to 44, `min-[80px]` → `min-h-[80px]`, `progressbar`
→ a descriptive role.

**PR 6 — Web a11y + charts (P1/P2).**
Always-visible row actions (`focus-visible:opacity-100` + a visible affordance), ≥ 44 px mobile-web
targets, `safe-area-bottom` defined, a legend + summary for every chart, `scope` on table headers,
`DialogDescription`, labels and `aria-describedby` on every input, a named sidebar nav landmark.

**PR 7 — Forms, states and feedback on both clients (P2).**
Enable the submit button and validate on blur so errors can be shown; visible labels; adjacent +
announced errors; an error summary on web; success feedback after every save; visible error states
instead of `console.error`; scrollable, keyboard-aware forms with bottom safe-area insets;
`loading.tsx` / `error.tsx` / `not-found.tsx` on the web routes.

**PR 8 — Token and layout consistency (P3).**
A real `--radius` scale on web, one `formatCurrency` helper, one icon library per client, drop the
two unused fonts, remove the legacy alias tokens, unify tracking on the ledger-label role, unify
`+`/`−` sign conventions, and delete the orphaned routes/components.

---

## 7. Open decisions for the owner

1. **Web accent color.** Adopt orange `--primary` (recommended, matches mobile) or keep green
   `--primary` and only add the missing brand tokens? This changes every web surface.
2. **Web theme default.** `defaultTheme="dark" enableSystem={false}` and no theme toggle — keep
   dark-first, add a toggle, or follow the system?
3. **Web light theme.** The light palette is structurally broken (§2.2). Support it properly, or
   remove the `:root` light tokens and ship dark-only?
4. **Tab bar sizing.** Let React Navigation size the tab bar (safe-area aware) instead of setting
   an explicit `height`?
5. **Landing route.** One canonical post-login route (recommend `/dashboard` on web,
   `/(tabs)/home` on mobile) used by the callback, the guard and the login screen.
6. **Onboarding.** `app/(app)/customers/page.tsx` shows both a header "Add Customer" and a fixed
   FAB on mobile — keep one.
