# Spec Delta

## Purpose

Tighten the web visual contract so a shopkeeper can see their money and act on it from a phone
without scrolling, and so the same number, action and colour mean the same thing on every screen.

## ADDED Requirements

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
