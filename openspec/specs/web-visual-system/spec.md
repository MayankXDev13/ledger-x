# web-visual-system Specification

## Purpose

Defines the Ledger-X web client's visual and interaction contract so the browser app shares the
mobile brand language, renders every screen accessibly, and never misleads a shopkeeper about money,
state, or which action is primary.

## Requirements

### Requirement: Brand and semantic color roles

The web client SHALL use the brand orange ramp — `#EA580C` for identity and icons, `#C2410C` behind white labels, `#FB923C` as brand text on dark — for brand and primary actions, neutral tokens for surfaces and text, rose for destructive and overdue money, and emerald exclusively for money received. Blue and purple SHALL NOT appear as brand colors.

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

The web client SHALL use one Devanagari-capable sans family for UI and headings, a monospaced family for ledger labels and numerals only, and SHALL NOT load font families it does not use. Every monetary value SHALL use tabular numerals, and no body or label text SHALL render below 12px.

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
