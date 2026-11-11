# Proposal

## Why

A comprehensive frontend design audit of Ledger-X against the `frontend-design` and `ui-ux-pro-max` standards identified key discrepancies between the product's authentic domain (a digital khata for Indian shopkeepers) and several lingering AI-generated SaaS design tropes. Specifically, web authentication and dashboard views still use generic boilerplate copy ("Finance Intelligence Platform", "0ms Latency", "Track every transaction."), single-word headline color accents, and repetitive SaaS-card kits with hover lifts and tracked-out all-caps eyebrows. Furthermore, the web customer list fails to display customer balances or aging indicators, unlike the mobile client. Refining these elements will eliminate generic template chrome, elevate visual hierarchy, and ground the interface in the real-world operational needs of shopkeepers.

## What Changes

- **Web Brand & Sign-in Panel**: Replace generic tech SaaS marketing copy ("Finance Intelligence Platform", "∞ Transactions", "0ms Latency", "100% Uptime", animated blur blobs) with authentic, grounded shopkeeper messaging consistent with mobile ("Daily khata for small shops", "Built for the counter, not the boardroom").
- **Headline & Typography Restraint**: Remove single-word color highlights in headings (e.g. `BrandPanel` and `DashboardPage` greeting), remove emoji clutter (`👋`), and eliminate cramped 16px badge heights (`h-4`) that clip 12px text in transaction list items.
- **Customer List Parity & Ledger Density**: Redesign `CustomerCard` on the web to display the customer's current outstanding balance, aging status, and settled badge using tabular numerals, matching the mobile app's information architecture.
- **Visual Hierarchy & SaaS-Kit Cleanup**: Replace decorative card-hover drop shadows and identical heavy card wrappers with clean hairline borders, purposeful visual rhythm, and consolidated customer detail stats (avoiding 4 giant duplicated metric cards that push ledger transactions below the fold).
- **Accessible & Consistent Interaction**: Ensure all interactive elements meet 44px touch targets on mobile/touch viewports, maintain visible focus rings, and replace decorative middle-dot and chevron clutter with clear, purposeful layout grammar.

## Capabilities

### Modified Capabilities
- `web-visual-system`: Updates web visual requirements to mandate customer balance visibility on customer cards, eliminate AI design tells (fake metrics, single-word headline accents, ungrounded marketing boilerplate), and enforce unclipped badge typography.
- `customer-transaction-summary`: Specifies that customer summaries in customer list views must surface outstanding balances and aging indicators on both web and mobile platforms.

## Impact

- **Affected Code**: `apps/web/components/login/BrandPanel.tsx`, `apps/web/app/login/page.tsx`, `apps/web/app/(app)/dashboard/page.tsx`, `apps/web/components/customers/CustomerCard.tsx`, `apps/web/components/customers/CustomerAnalyticsCards.tsx`, `apps/web/components/transactions/TransactionItem.tsx`, and associated styles/tokens.
- **APIs & Dependencies**: No breaking schema or API changes; uses existing `useCustomers`, `useCollection`, and customer transaction hooks.
- **Visual & Design Regression**: All checks in `bun run check:visual` must continue to pass with 0 token and contrast violations.
