# Web — Collection (`/collection`) and Settings (`/settings`)

> Overrides `design-system/ledger-x/MASTER.md` for
> `apps/web/app/(app)/collection/page.tsx` and `apps/web/app/(app)/settings/page.tsx`.

## 1. Collection list

The page answers one question: **"who owes me money, and how do I collect it?"**

```
[ title + outstanding total (hero)      ]
[ aging summary (inline stats)          ]
[ customer rows                          ]
[ UPI config notice (only when needed)  ]
```

- Rows: customer name (1 line, truncated) + phone (12px muted) on the left;
  **outstanding amount** (`tabular-nums`) + "Oldest unpaid: N days" on the right;
  the two actions at the end.
- The amount block must not overflow at 320–375px — it currently has no `truncate`/`min-w-0`
  (`collection/page.tsx:276-289`). A 7-digit balance (₹12,34,567) forces horizontal overflow.
- "Copy link" and "QR" are `size="sm"` → 32px tall. Touch targets must be ≥ 44px on mobile web.
- The disabled state of those buttons is explained only through `title=`, which is not reliably
  announced. Use `aria-describedby` pointing at the visible notice.
- The notice under the list uses a `Loader2` **spinner** for a static condition, in an off-token
  `text-amber-400` (`collection/page.tsx:336-343`). Use an info icon + `text-muted-foreground`,
  and the `warning` token only if it really is a warning.
- Errors must not masquerade as "everything is settled": `collection/page.tsx:96,229` renders
  "Nothing to collect / Every customer is settled." when the request failed. Branch on `isError`.

## 2. UPI QR dialog

- QR on a white plate (`bg-white p-4 rounded-xl`) is correct — scanners need the contrast.
  It is a **scanning surface**, not a content card, so the "no white card on dark" rule does not
  apply here.
- Keep the `aria-label` on the QR (`collection/page.tsx:364`) and add the amount and the UPI ID as
  visible text below it, which the dialog already does.
- The dialog states that "payment completion is recorded manually" — keep that sentence; it is
  the honest explanation for the shopkeeper.

## 3. Settings

- The UPI fields must be a real `<form>` with `type="submit"`, so Enter saves
  (`settings/page.tsx:164-213`).
- The UPI error must be adjacent to the field, with `aria-invalid` and `aria-describedby`
  (`settings/page.tsx:170-179`).
- The settings query needs an error branch: today a failed fetch renders empty `upiId` /
  `payeeName`, and a later Save would overwrite the stored VPA with blanks
  (`settings/page.tsx:158-162`).
- Account deletion is guarded by typing `DELETE` with a disabled submit — keep that pattern.
- The `DELETE` confirmation text uses `font-mono` for the literal; that is fine (Latin + numerals,
  which IBM Plex Mono / JetBrains Mono cover) — but the *surrounding* text must not be mono.

## 4. Mobile web chrome (shared)

- The bottom nav must clear the iOS home indicator: define
  `.safe-area-bottom { padding-bottom: env(safe-area-inset-bottom); }` (the class is used at
  `components/MobileBottomNav.tsx:60` and is currently undefined) or replace it with an inline
  `style`.
- Fixed bottom bars (`customers/page.tsx:79`, `CustomerDetailView.tsx:224`) need the same inset.
- The bottom nav has exactly 3 destinations plus a profile sheet — within the ≤5 limit. Keep the
  text labels; they are the only non-colour active cue besides the dot.
- Give the sidebar `<nav>` an `aria-label` (`components/AppSidebar.tsx:154`) so the two `nav`
  landmarks are distinguishable.
