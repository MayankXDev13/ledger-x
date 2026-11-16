# Design

## Decisions

### Mobile dashboard composition

Keep the page a client component. Below `lg`, render a single hero card containing the outstanding
figure and a text line "Across N customers". Directly beneath it place two buttons in one row:
"Record payment" using `--primary` and "Give credit" as a secondary outline button. Both open the
existing transaction dialog with their type preselected, so no new API work is needed. Move
"Add Customer" into the header as a small named icon control below `lg`. Collapse "Total customers"
and "Monthly net" into one `grid-cols-2` row of stat cells separated by a hairline, each about 56px
tall. Reuse existing `Button`, `Card` and token utilities; do not add a new component library.

### Primary action audit

Search each screen for `bg-gradient-brand` and `bg-primary` usages and ensure only one is a full-width
or prominent action. On customer detail, keep the sticky bottom "Add transaction" bar and shrink the
in-card control to an icon button with `aria-label`. This follows the existing decision already made
on the customer list in task 4.11 of the previous audit change.

### Balance tone

Introduce one shared helper `lib/money.ts` already exists; add a small `balanceTone(ageDays: number |
null)` returning `"neutral" | "danger"` at the 60-day boundary. Use it in the customer-detail hero,
collection rows and customer cards so the aging rule has one implementation. Keep the "Receivable
from customer" text node unconditionally so colour never carries the direction alone.

### Shared labels

Add exported constants for the two strings that currently drift: `TOTAL_OUTSTANDING_LABEL =
"Total outstanding"` and `OLDEST_UNPAID = (days: number) => "Oldest unpaid " + days + " days"`.
Place them in `lib/labels.ts` and import them in dashboard, collection, customer cards and customer
detail. Use "Collection" in both the desktop sidebar and the bottom navigation.

### Collection compaction

Combine the two top cards into one card with the outstanding figure on the left and the UPI line on
the right on desktop, stacked on mobile. Make the UPI action row a single line with `Copy link` and
`QR` as small named buttons. Put the aging label above the actions on narrow viewports with
`whitespace-nowrap`. Target: the first `.outstanding-row` intersects the viewport at 360×800.

### Density at 360px

Customer detail statistics: below `sm`, drop the icon circles and use four stacked hairline rows with
label left and amount right. Customer cards: restructure so the name occupies a dedicated first line
with `min-w-0` and `flex-1`, and the outstanding amount plus aging sit on a second line; omit the
phone on the card. Keep 12px as the minimum text size and `tabular-nums` on amounts.

### Login panel

Replace the three stat tiles with three plain text benefits: "Zero paper slips", "UPI collection
link", "Works offline". Change the headline and body copy to plain descriptions of the product and
remove the "1-Tap" claim. Raise `text-white/80` small labels to full white or a verified tint and
check against the darker end of the brand gradient with `bun run check:contrast`. Change the brand
headline from `<h1>` to `<p>` so "Welcome back" is the only top-level heading.

### Polish

Statement filter: one `flex-wrap` row with `gap-3` for start, end, apply and clear, with `Clear` as a
ghost button in the same row. Collection sort: replace the filled pill group with the existing
underline-tab pattern (label plus 2px active underline, `aria-selected`). Timestamp: add
`whitespace-nowrap` and allow the block to use the full card width on narrow screens.

## Risks and mitigations

- **Regression in token or contrast checks.** All colour changes use existing tokens; run
  `bun run check:visual` before and after. Any new literal hex fails review.
- **Broken transaction dialog preselect.** The dialog already accepts a type, so pass the existing
  prop rather than adding state. Cover the two dashboard entry points with a unit or interaction test.
- **Layout shifts at intermediate widths.** Verify 360, 768 and 1440 in the fresh screenshot matrix,
  not only the two target widths.
- **Stale matrix.** Capture screenshots from the current working tree into the change's own
  screenshots folder, as the previous audit change did, and do not overwrite archived artifacts.
