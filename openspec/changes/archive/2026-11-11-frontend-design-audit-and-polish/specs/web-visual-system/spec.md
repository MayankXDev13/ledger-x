# Spec Delta

## MODIFIED Requirements

### Requirement: Brand and semantic color roles
The web client SHALL use the brand orange ramp — `#EA580C` for identity and icons, `#C2410C` behind white labels, `#FB923C` as brand text on dark — for brand and primary actions, neutral tokens for surfaces and text, rose for destructive and overdue money, and emerald exclusively for money received. Blue and purple SHALL NOT appear as brand colors. The web client SHALL NOT use single-word color accent highlights in headings, generic AI-generated marketing copy, or ungrounded vanity metrics.

#### Scenario: Primary action renders with a visible brand fill
- **WHEN** a primary call to action renders
- **THEN** it has an opaque brand-colored background rather than no background
- **AND** its label meets a 4.5:1 contrast ratio against that fill

#### Scenario: Money states are distinguishable
- **WHEN** a received payment and an outstanding balance appear on the same screen
- **THEN** the received payment uses the positive token and the outstanding balance uses a neutral or overdue token
- **AND** each carries a sign or a text label in addition to color

#### Scenario: No competing brand hues
- **WHEN** any web screen, dialog, chart, empty state, or brand mark renders
- **THEN** no blue or purple brand accent is present

#### Scenario: Authentic grounded copy and clean typography
- **WHEN** brand panels, sign-in screens, or dashboard headers render
- **THEN** headings avoid single-word color accents and AI boilerplate metrics
- **AND** copy speaks to real shopkeeper ledger operations

### Requirement: Typography and money numerals
The web client SHALL use one Devanagari-capable sans family for UI and headings, a monospaced family for ledger labels and numerals only, and SHALL NOT load font families it does not use. Every monetary value SHALL use tabular numerals, no body or label text SHALL render below 12px, and badges SHALL provide sufficient vertical line height to prevent text clipping.

#### Scenario: Amounts align in lists
- **WHEN** multiple amounts render in a column
- **THEN** their digits align vertically and do not shift as the value changes

#### Scenario: Text size floor
- **WHEN** any web screen renders secondary text, dates, labels, or legends
- **THEN** the rendered size is at least 12px

#### Scenario: Long and Devanagari names truncate
- **WHEN** a customer name is long or written in Devanagari
- **THEN** it truncates with an ellipsis without breaking the row
- **AND** it does not fall back to a face without Devanagari coverage

#### Scenario: Icons come from one library
- **WHEN** the sidebar, dashboard or any other screen renders an icon
- **THEN** the icon comes from Lucide with one stroke weight

#### Scenario: Badge typography does not clip
- **WHEN** transaction badges or status indicators render
- **THEN** the badge container height accommodates the text and tracking without vertical clipping

## ADDED Requirements

### Requirement: Customer cards display balance and aging state
Customer list items and cards SHALL display the customer's identity, contact information, current outstanding balance in tabular numerals, and payment/aging status so shopkeepers can identify receivables without opening individual detail views.

#### Scenario: Customer card shows outstanding balance
- **WHEN** a customer with an active balance renders in the customer list or grid
- **THEN** their outstanding balance is displayed formatted with tabular numerals and a currency symbol
- **AND** settled customers are visibly marked as settled
