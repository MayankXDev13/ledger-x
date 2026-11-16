# web-visual-system Specification

## Purpose

Defines the Ledger-X web client's visual and interaction contract so the browser app shares the
mobile brand language, renders every screen accessibly, and never misleads a shopkeeper about money,
state, or which action is primary.

## Requirements

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

### Requirement: Declared tokens resolve to real values

Every color token and custom utility class used by the web client SHALL be declared with a real value in the stylesheet, and the light and dark themes SHALL each define background, foreground, card, border, and muted tokens. A class with no matching declaration SHALL NOT be used to render a control, a surface, or a text treatment.

#### Scenario: Brand utilities resolve

- **WHEN** a screen renders a brand gradient, a brand tint, or a brand text color
- **THEN** the referenced custom properties are declared
- **AND** the element shows the intended color rather than no background

#### Scenario: Both themes define surfaces

- **WHEN** the app renders in the light theme
- **THEN** background, foreground, card, border, and muted tokens are all defined
- **AND** the page background and body text resolve from those tokens

#### Scenario: No dead utilities

- **WHEN** the web sources are scanned for custom utility class names
- **THEN** each one is either defined in the stylesheet or removed from its usages

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

### Requirement: Aging strip is the web signature

The web client SHALL present the `0-30 / 31-60 / 60+` receivables aging as its signature element on the dashboard, with proportional emphasis, reusing the mobile bucket semantics.

#### Scenario: Aging visible above the fold

- **WHEN** a user with outstanding balances opens the dashboard
- **THEN** the three aging buckets are visible with values and the oldest-bucket highlight

#### Scenario: Aging colours match the mobile map

- **WHEN** an aging segment or legend swatch renders
- **THEN** it uses the same bucket colours as the mobile client — neutral up to 30 days, rose for 31–60 and the deeper rose past 60 — and never emerald, which means money received

### Requirement: Chart series carry meaning and a fallback

Every chart SHALL encode its series with theme-aware tokens, SHALL distinguish series by more than hue, SHALL carry a legend with text labels, SHALL preserve a value's direction in its tooltip, and SHALL expose an accessible name plus a text or table fallback. Credit given SHALL NOT be colored as money received.

#### Scenario: Credit and paid are distinguishable

- **WHEN** the dashboard renders the credit versus paid chart
- **THEN** the two series are distinguishable without relying on hue alone
- **AND** a received payment is never colored as a loss

#### Scenario: Chart is announced and has a fallback

- **WHEN** a chart renders
- **THEN** it exposes an accessible name or summary
- **AND** a text summary or data table presents the same information

#### Scenario: Chart is readable in both themes

- **WHEN** the chart renders in the light theme and in the dark theme
- **THEN** grid lines, axes, and series remain visible in both

#### Scenario: Tooltip preserves direction

- **WHEN** a user reads a tooltip for a credit or a payment
- **THEN** the sign or direction of the value is shown rather than an absolute value

### Requirement: Every action is reachable and named

No control SHALL be operable only by hover. Every icon-only control SHALL expose an accessible name, every disabled control SHALL explain why it is unavailable, and focus SHALL remain visible on every interactive element.

#### Scenario: Row actions do not require hover

- **WHEN** a row exposes edit or delete actions
- **THEN** those actions are visible without a pointer hover
- **AND** they are reachable by keyboard and by touch

#### Scenario: Icon-only controls are named

- **WHEN** an icon-only control renders
- **THEN** it exposes an accessible name to assistive technology

#### Scenario: Disabled controls explain themselves

- **WHEN** a control is disabled because a prerequisite is missing
- **THEN** the reason is visible in the interface
- **AND** it is associated with the control for assistive technology

#### Scenario: Focus stays visible

- **WHEN** a control receives keyboard focus
- **THEN** a visible focus indicator is rendered

### Requirement: Forms explain their state

Every input SHALL have a visible label, validation SHALL run without requiring a submit, validation errors SHALL be shown next to the field they belong to and SHALL be announced, and a submission SHALL show loading, then success, then failure. A failed submission SHALL NOT close the form without an explanation.

#### Scenario: Invalid input is explained

- **WHEN** a required field is empty and the user attempts to submit
- **THEN** the form stays open
- **AND** an error appears next to that field naming what is missing

#### Scenario: Errors are announced

- **WHEN** a validation error appears
- **THEN** it is programmatically associated with its field
- **AND** it is announced to assistive technology

#### Scenario: Submission feedback

- **WHEN** a submission is in flight
- **THEN** the control shows a loading state and cannot be triggered twice
- **AND** on completion the outcome is confirmed or the failure is shown inline

#### Scenario: Numbers are validated in human terms

- **WHEN** a numeric field is cleared or holds a non-number
- **THEN** the message names the problem in human terms rather than exposing a raw parser error

### Requirement: Loading, empty, and error states are honest

A failed data request SHALL NOT render as an empty or all-clear state. Every route SHALL provide an error boundary and a loading state, and a failed request SHALL offer a retry path.

#### Scenario: Failure is not an empty state

- **WHEN** a list request fails
- **THEN** the screen shows a failure with a retry action
- **AND** it does not claim there is nothing to show

#### Scenario: Route error boundary

- **WHEN** a route throws while rendering
- **THEN** a route-level error boundary renders a recoverable message instead of a blank page

#### Scenario: Loading reserves space

- **WHEN** a list is loading
- **THEN** a placeholder occupies the final layout height
- **AND** the layout does not jump when the data arrives

### Requirement: Small screens and safe areas

The web client SHALL remain usable at 360px width with no horizontal page scroll, SHALL let wide tables scroll inside their own container, SHALL keep fixed bottom chrome clear of the device home indicator, and SHALL present one primary action per viewport.

#### Scenario: Wide tables scroll within their container

- **WHEN** a table has more columns than fit a 360px viewport
- **THEN** the table scrolls inside its own container
- **AND** the page itself does not scroll horizontally

#### Scenario: Bottom chrome clears the home indicator

- **WHEN** the mobile bottom navigation renders
- **THEN** its content sits above the device home indicator

#### Scenario: One primary action per viewport

- **WHEN** a screen is viewed on a small viewport
- **THEN** only one primary action is offered

### Requirement: Navigation is predictable

Each navigation landmark SHALL be distinguishable, a signed-in user SHALL always land on the same route, deleting a record SHALL leave the deleted record's page, and breadcrumbs SHALL mark the current page.

#### Scenario: One landing route

- **WHEN** a user completes sign-in
- **THEN** they land on the same route regardless of whether they arrived through the auth callback or the auth guard

#### Scenario: Landmarks are distinguishable

- **WHEN** a screen renders more than one navigation landmark
- **THEN** each landmark has a distinguishing accessible name

#### Scenario: Deleting a record leaves its page

- **WHEN** a customer is deleted from their detail page
- **THEN** the app navigates away from that page
- **AND** the cached customer and dashboard data are refreshed

#### Scenario: Current page is marked

- **WHEN** a breadcrumb renders
- **THEN** the current page is identified programmatically and not by color alone

### Requirement: Customer cards display balance and aging state

Customer list items and cards SHALL display the customer's identity, contact information, current outstanding balance in tabular numerals, and payment/aging status so shopkeepers can identify receivables without opening individual detail views.

#### Scenario: Customer card shows outstanding balance

- **WHEN** a customer with an active balance renders in the customer list or grid
- **THEN** their outstanding balance is displayed formatted with tabular numerals and a currency symbol
- **AND** settled customers are visibly marked as settled

### Requirement: Mobile dashboard leads with money and the correct primary action

At viewports below the desktop breakpoint, the dashboard SHALL present one dominant "Total
outstanding" figure as the first card after the greeting, with a primary action to record a received
payment and a secondary action to give credit. Secondary statistics SHALL occupy one compact row
rather than separate full-width cards. Adding a customer SHALL NOT be the primary action.

#### Scenario: Shopkeeper sees the number and the action without scrolling

- **WHEN** the dashboard is rendered at 360×800
- **THEN** the outstanding figure and the "Record payment" control are both visible without scrolling
- **AND** the customer count and net flow appear in a single stat row beneath the hero
- **AND** "Add Customer" is not rendered as the screen's primary button

#### Scenario: Recording money takes one action from the dashboard

- **WHEN** a shopkeeper wants to record a payment or credit from the dashboard
- **THEN** a single tap opens the transaction entry flow
- **AND** no intermediate step of opening a customer card is required

### Requirement: One primary action per view

A view SHALL expose at most one visually primary action. Repeated entry points to the same operation
SHALL be represented by a single primary control plus, if needed, a smaller icon or text control with
an accessible name.

#### Scenario: Customer detail has one Add action

- **WHEN** the customer detail screen renders at any width
- **THEN** exactly one full-emphasis "Add transaction" action is visible
- **AND** any additional transaction entry control is a named, non-primary control

### Requirement: Outstanding balances stay neutral until overdue

An outstanding or receivable balance SHALL use neutral text tokens. Brand orange SHALL be reserved
for identity and primary actions. Danger or rose colouring SHALL apply only when the oldest unpaid
credit is 60 or more days old, and text SHALL always state the direction in addition to colour.

#### Scenario: Current receivable is neutral

- **WHEN** a customer's oldest unpaid credit is younger than 60 days
- **THEN** the balance figure uses the neutral foreground token
- **AND** a text label states that the amount is receivable from the customer

#### Scenario: Aged receivable is flagged without colour alone

- **WHEN** a customer's oldest unpaid credit is 60 or more days old
- **THEN** the balance figure uses the danger text token
- **AND** the overdue phrase is present as text

### Requirement: Money and navigation language is consistent

The same financial figure and the same destination SHALL use one label across all web screens. The
ledger total SHALL be called "Total outstanding". The collection destination SHALL use one label in
the sidebar and the bottom navigation. Aging SHALL be phrased in full as "Oldest unpaid N days" on
both collection rows and customer cards.

#### Scenario: The total has one name

- **WHEN** the ledger total appears on the dashboard and on the collection screen
- **THEN** both screens use the label "Total outstanding"
- **AND** no screen calls the same figure "Total balance" or "Total receivables"

#### Scenario: The collection destination has one name

- **WHEN** the sidebar and the bottom navigation render the collection entry
- **THEN** both use the same visible label

#### Scenario: Aging is not abbreviated inconsistently

- **WHEN** an unpaid age appears on a collection row and on a customer card
- **THEN** both use the phrase "Oldest unpaid N days"
- **AND** the phrase does not wrap between the number and the word "days"

### Requirement: Collection surfaces debtors before collection instructions

At narrow viewports the collection screen SHALL show the total and the UPI identifier in one compact
block followed immediately by the outstanding-balance list, so the first debtor is visible in the
initial viewport. The aging label SHALL not be squeezed against adjacent action buttons.

#### Scenario: The first debtor is visible on a phone

- **WHEN** the collection screen renders at 360×800
- **THEN** at least one outstanding-balance row is visible without scrolling
- **AND** the UPI identifier and its copy and QR actions occupy a single compact line

#### Scenario: Overdue age stays readable

- **WHEN** an aging label such as "Oldest unpaid 38 days" is rendered at 360px
- **THEN** it stays on one line or wraps above the action buttons
- **AND** it does not overlap or collide with those buttons

### Requirement: Small-screen density protects identifiers

At narrow viewports, customer identifiers SHALL remain legible and the supporting statistics SHALL
not wrap their labels awkwardly. Name truncation SHALL preserve the distinguishing portion of the
name, and phone numbers SHALL be shown on the detail screen rather than compressed into the card.

#### Scenario: Customer names remain identifiable

- **WHEN** the customer list renders at 360px
- **THEN** each customer name has at least 60 percent of the row width
- **AND** names are not truncated below roughly 18 characters
- **AND** amounts and aging occupy a separate line from the name

#### Scenario: Stat labels do not wrap into their icons

- **WHEN** the customer detail statistics render at 360px
- **THEN** each label and amount fits on one line
- **AND** no icon reduces the space available to the label or amount

### Requirement: Login copy is honest and accessible

The login brand panel SHALL describe real behaviour, SHALL NOT present vanity metrics or
unsupported one-tap claims, SHALL meet body-text contrast for its small labels, and SHALL expose a
single top-level heading on the page.

#### Scenario: Claims match behaviour

- **WHEN** the login panel is rendered
- **THEN** no stat presents zero, infinity or a latency or uptime figure
- **AND** no claim states that UPI collection is one tap
- **AND** the copy does not use generic marketing phrasing

#### Scenario: Small labels are legible and the page has one h1

- **WHEN** the login screen is rendered in either theme
- **THEN** every small label on the brand panel meets 4.5:1 contrast against its background
- **AND** the page exposes exactly one level-one heading

### Requirement: Filters and supporting text are predictable

Filter controls SHALL share one row where space allows, sort controls SHALL follow the underline-tab
pattern, and generated metadata SHALL not wrap mid-phrase at narrow widths.

#### Scenario: Statement filter stays on one row

- **WHEN** the statement period filter renders at 360px
- **THEN** the start date, end date, apply and clear controls wrap only as a whole row
- **AND** clear is not stranded on a line by itself

#### Scenario: Sort control follows the tab pattern

- **WHEN** the collection sort control renders
- **THEN** it uses underline tabs with a two-pixel active underline rather than filled pills
