# Mobile — 5 tabs (Home · Ledger · Collection · Customers · Profile)

> Overrides `design-system/ledger-x/MASTER.md` for the Expo/NativeWind app.
> Contract: `docs/mobile-visual-system.md`.
> Applies to `apps/app/app/(tabs)/*.tsx`, `apps/app/components/*`.

## 1. Screen contract

Every tab screen follows the same skeleton:

```
[ safe area top ]
[ screen title / greeting          ]   24/30 mukta-bold
[ supporting meta                  ]   13/18 mukta-medium, ink-muted
──────────────────────────────────────── hairline
[ HERO NUMBER                      ]   one only, 34/38 mukta-black, tabular
[ supporting stat · supporting stat]  inline, hairline separated, 13/18
[ action row: primary + secondary  ]   44–48px tall
[ section title                    ]   16/22 mukta-semibold
[ list rows                        ]   64px min height, 1px hairline
[ safe area bottom ]
```

- **One hero number.** Never two. If a second number matters it becomes an inline stat.
- Background is `bg` `#0A0A0A`; surfaces are `surface` `#171717`; **no white content cards**.
- Nothing is a floating card unless it is genuinely a card (dialog, sheet, summary panel).

## 2. Home (`home.tsx`)

Current state violates the contract — it still renders an orange page (`bg-brand-primary`)
with white cards (`bg-white`) and a white-card trend chart.

**Target:**
- Screen background `bg`, hero on `surface`.
- The hero is **total outstanding**, tabular, 34/38 mukta-black, in `ink`.
  Zero state: show a formatted `₹0` and a direct "Add your first customer" action.
- The aging strip sits on `surface` and its segments keep their contractual fills
  (`#737373` / `danger-text` `#FB7185` / `danger` `#E11D48`) — on a dark surface these read at
  3.0:1 / 7.0:1 / 4.6:1. **On orange they are 0.75:1 / 1.32:1 / 0.75:1 — invisible.**
  If the strip is ever placed on orange, it needs light fills (`white/40`, `white/70`, `white`).
- The 12-month trend: credit = neutral ink bar, paid = emerald bar, legend text in
  `ink-muted` matching the bar fills exactly. One source of truth for the color map.
- "Add credit" / "Record payment" use `brand-fill` `#C2410C` with white text (**5.2:1**), not
  `#EA580C` with white (**3.6:1**) and not white fill with orange text.
- Quick-add rows are ≥ 44px tall, pressable with `active:opacity-80` + 120ms.

## 3. Ledger (`ledger.tsx`) — reference implementation

Keep as is. It is the best screen in the app and should be the template for the others:

- Underline filter tabs with counts and `accessibilityState={{ selected }}`.
- Day-grouped `SectionList` with sticky headers.
- Honest scope disclosure ("Recent activity · last 5").
- `MoneyText` for every amount (it already sets `tabular-nums`).
- Inline search with a labelled clear button, and a real empty state that routes to Customers.

Small fixes: `font-plex text-[10px]` → `text-[11px]` (ledger label role is 11/14);
filter labels `text-[14px]` → 15/22 body role; clear-search button ≥ 44 wide.

## 4. Collection (`collection.tsx`)

- Customer rows: name (15/22 semibold) + outstanding amount (tabular) + UPI badge.
- UPI QR sheet: QR + `upi://pay` link + amount, `surface` background, 16 radius.
- Amount is always signed and labeled ("Outstanding ₹1,200"), never color-only.
- List rows 64px; the QR action row ≥ 44px.
- Loading uses a skeleton; `ListEmptyComponent` must exist even while loading so the layout
  does not jump.
- `error` from `useCollection` is currently never rendered — render it with a retry.

## 5. Customers (`customers.tsx`)

- Search + inline clear (≥ 44px wide) + count.
- Customer card: avatar, name (1 line), phone (13/18 muted), outstanding (tabular).
- New-customer primary action, ≥ 44px, `brand-fill` + white.
- Empty state: "No customers yet" + Add customer.

## 6. Profile (`profile.tsx`)

- Sections: Account · UPI collection · Data (export/archive/delete) · Session.
- UPI fields need **visible labels** ("UPI ID", "Payee name") — they are currently
  placeholder-only, which fails WCAG 3.3.2.
- The account-deletion action is guarded by typing `DELETE` and a disabled submit — keep.
- Exactly one sign-out control.
- Placeholder menu rows must stay gone; "Invite a shopkeeper" is a real share action.

## 7. Cross-cutting rules for the tab shell

| Rule | Current state |
|---|---|
| Tab bar height | Must be `56 + insets.bottom` **without** overriding React Navigation's own safe-area sizing — the current explicit `height` leaves only ~40px for a 24px icon + 11px label, so the label clips on notched devices |
| Tab active tint | `#EA580C` (`brand.primary`) — `#FF6A00` is an off-token orange |
| Tab label font | `fontFamily: Mukta_500Medium` — the label currently renders in the system face |
| Session state | `useAuth()` must be a single shared provider; 5 independent instances = 5 network session fetches per cold start |
| Offline queue | One controller, not 3 — three `useOfflineQueue()` instances each call `processQueue()` on reconnect and can replay the same FIFO rows twice |
| Settings | One shared `useSettings()` instance; today Profile and Collection keep separate copies and clobber each other |
| Status bar | One root `<StatusBar style="light" />`. `style="auto"` on add/edit screens resolves against the *system* theme while the app is forced dark → invisible icons on light-mode devices |
| Back button | Android hardware back pops the stack on every screen |
| Landing route | One canonical post-login route; `login.tsx` redirects to Customers while `AuthGuard` redirects to Home |
