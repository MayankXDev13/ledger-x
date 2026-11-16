# Web — Collection (`/collection`) and Settings (`/settings`)

> Overrides `design-system/ledger-x/MASTER.md` for
> `apps/web/app/(app)/collection/page.tsx` and `apps/web/app/(app)/settings/page.tsx`.

## 1. Collection list

The page answers one question: **"who owes me money, and how do I collect it?"**

```
[ title + sort tabs (underline tabs: By amount | By age) ]
[ COMPACT SUMMARY CARD                                   ]
[   Total outstanding (left) · UPI ID + Copy + QR (right)]
[ customer rows (first row visible at 360×800)           ]
```

- **Compact summary card:** The total outstanding (`TOTAL_OUTSTANDING_LABEL`) and the UPI block are merged into a single compact card with the UPI id, Copy link and QR on a single line. At 360×800 the first debtor row is visible without scrolling.
- **Sort tabs:** Replaced filled pills with underline tabs using `role="tab"` and `aria-selected` with a 2px active underline.
- **Rows:** Customer name (1 line, truncated) on the left;
  **outstanding amount** (`tabular-nums`) + full aging phrase `oldestUnpaidLabel` on the right;
  the two actions at the end.
- **Aging label & tone:** Uses `balanceTone` (neutral < 60d, danger ≥ 60d) and `whitespace-nowrap` above action buttons on narrow viewports so "Oldest unpaid 38 days" never overlaps Copy link or QR.
- "Copy link" and "QR" are `size="sm"` buttons. On mobile rows, touch targets remain accessible.
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
