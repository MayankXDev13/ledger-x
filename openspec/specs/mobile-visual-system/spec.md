# mobile-visual-system Specification

## Purpose

Defines the visual and interaction language for the Ledger-X mobile app so the five shopkeeper screens share one color system, one type system, one layout grammar, and honest, accessible controls.

## Requirements

### Requirement: Brand and semantic color roles

The app SHALL use Tailwind orange-600 (`#EA580C`) for brand identity and primary actions, Tailwind neutral shades for surfaces and text, rose-600 (`#E11D48`) for overdue money and destructive actions, and emerald for payments received. Blue and purple SHALL NOT appear as brand colors. Emerald SHALL NOT be used for selection, onboarding progress, unlock actions, success confirmations, connectivity status, or any other state that is not money received, and a screen SHALL NOT use the brand color as its page background.

#### Scenario: Action color is orange
- **WHEN** a primary action or active navigation state renders
- **THEN** it uses the orange brand color while inactive and non-interactive elements use neutral shades

#### Scenario: Money states are distinguishable
- **WHEN** a payment received and an outstanding balance appear on the same screen
- **THEN** they use emerald and neutral/rose respectively, and each carries a text label or sign in addition to color

#### Scenario: No competing brand hues
- **WHEN** any of the five tabs, the launch screen, or a modal renders
- **THEN** no blue or purple brand accent is present

#### Scenario: Emerald is reserved for money received
- **WHEN** a selection, onboarding step, unlock button, success confirmation, or connectivity indicator renders
- **THEN** it does not use emerald

#### Scenario: The brand color is not a page background
- **WHEN** any screen renders its background
- **THEN** the background is a neutral surface rather than the brand color

### Requirement: Neutral surfaces and readable contrast

The app SHALL render on a neutral-950 background with neutral-900 surfaces, neutral-800 borders, neutral-50 primary text, and no text below 4.5:1 contrast for normal sizes. White cards SHALL NOT be used as content surfaces, and no screen SHALL paint its page background in the brand color.

#### Scenario: Body and secondary text pass contrast
- **WHEN** any screen renders labels, dates, notes, or helper copy
- **THEN** the text meets WCAG AA against its actual background

#### Scenario: No white content cards
- **WHEN** Home or Collection renders metrics, trend, or actions
- **THEN** content sits on dark neutral surfaces with hairline borders, not white panels

#### Scenario: Orange fills stay accessible
- **WHEN** white text sits on an orange primary button
- **THEN** the fill is dark enough for the label to meet AA, or the label uses near-black text on orange-600

#### Scenario: Aging colors stay legible
- **WHEN** an aging segment or aging legend swatch renders on its surface
- **THEN** it is distinguishable from that surface at a visible contrast

### Requirement: Typography and money numerals

The app SHALL use a single sans family with Devanagari coverage for UI and headings, a monospaced family for ledger labels and dates, and a fixed type scale. All monetary values SHALL use tabular numerals, in every component that renders an amount and not only in the shared money component. The tab bar label SHALL use the UI family.

#### Scenario: Amounts align in lists
- **WHEN** multiple amounts render in a column
- **THEN** digits align vertically and do not shift as values change

#### Scenario: Long names and Devanagari render
- **WHEN** a customer name is long or written in Devanagari
- **THEN** it truncates with an ellipsis without breaking the row layout and without a mismatched fallback face

#### Scenario: Type scale is respected
- **WHEN** screen titles, section titles, body, meta, and labels render
- **THEN** each uses one of the defined scale steps rather than an arbitrary size

#### Scenario: Every amount renderer uses tabular numerals
- **WHEN** a balance, total, statement amount, or input amount renders outside the shared money component
- **THEN** it uses tabular numerals

### Requirement: One hero number per screen

Each screen SHALL have at most one visually dominant figure. Home SHALL present total outstanding money as its hero and SHALL NOT present a 2x2 grid of equal white metric cards. Home SHALL render its hero, supporting stats, and actions on the dark neutral surfaces defined by the neutral-surface requirement.

#### Scenario: Home hierarchy
- **WHEN** Home finishes loading
- **THEN** total outstanding is the largest figure on the screen, with supporting customer, month, and collection figures presented as quieter inline stats

#### Scenario: New shop with no data
- **WHEN** Home loads with zero customers and zero transactions
- **THEN** the hero shows a formatted zero amount and a direct path to add the first customer, not a blank or broken layout

#### Scenario: Home surfaces are dark
- **WHEN** Home renders its hero, trend, and top debtors
- **THEN** each sits on a dark neutral surface with hairline borders rather than a white panel on a brand-colored page

### Requirement: Ledger reads as a chronological ledger

The Ledger screen SHALL group the available entries by day, show signed and formatted amounts, and expose filters with result counts. Because the data source returns only the most recent entries, the screen SHALL label the feed as recent activity and SHALL NOT imply complete history.

#### Scenario: Entries are grouped by day
- **WHEN** the available transactions span multiple days
- **THEN** the list shows day headings such as Today and Yesterday above the relevant rows

#### Scenario: Scope is disclosed
- **WHEN** the Ledger screen renders
- **THEN** it states that the list is recent activity rather than the complete ledger

#### Scenario: Filters report counts
- **WHEN** the user views the All, Credit, and Payment filters
- **THEN** each filter shows how many entries it contains and the selected filter is indicated by more than color alone

### Requirement: Collection centers the QR and performs real actions

The Collection screen SHALL make the shop QR the focal element, SHALL NOT include a white Quick Actions card, and SHALL only offer actions that complete the stated outcome.

#### Scenario: Shop QR has no fixed amount
- **WHEN** the shop-wide QR is generated
- **THEN** it encodes the payee and currency without pre-filling a payment amount

#### Scenario: Download produces a file
- **WHEN** the user selects Download QR
- **THEN** a QR image file is produced or the action is absent; opening a share sheet alone does not count as downloading

#### Scenario: Print opens a print target
- **WHEN** the user selects Print QR
- **THEN** the platform print flow opens with the QR, or the action is absent

#### Scenario: UPI is not configured
- **WHEN** no UPI ID is saved
- **THEN** the QR area explains how to add one and every QR action is disabled with visible feedback

### Requirement: Customer rows show identity and balance together

Customer list rows SHALL always show the customer's name and phone number, and SHALL show the outstanding amount and age when a balance exists.

#### Scenario: Debtor row
- **WHEN** a customer has an outstanding balance
- **THEN** the row shows name, phone, outstanding amount, and unpaid age without hiding the phone

#### Scenario: Settled customer row
- **WHEN** a customer has no outstanding balance
- **THEN** the row shows name and phone with no amount or age

### Requirement: Profile separates identity, settings, and destructive actions

Profile SHALL display the real shop or account name, SHALL provide exactly one logout control, and SHALL keep destructive actions behind an explicit confirmation step.

#### Scenario: Real identity
- **WHEN** Profile loads for a signed-in user
- **THEN** the header reflects that user or shop name rather than placeholder text

#### Scenario: Single logout
- **WHEN** Profile renders
- **THEN** exactly one logout control is visible

#### Scenario: Destructive action is guarded
- **WHEN** the user chooses to delete the account
- **THEN** deletion requires a separate confirmation step and cannot be triggered by a single accidental tap

### Requirement: Every visible control performs its stated action

A control SHALL perform the action its label or icon communicates, or SHALL be removed. Controls SHALL NOT be rendered as inert decoration, and unavailable actions SHALL explain why they are unavailable.

#### Scenario: Search and filter controls work
- **WHEN** the user taps a search or filter control
- **THEN** it opens search input or filter options, or it is not rendered

#### Scenario: Placeholder menu rows are removed
- **WHEN** a Profile menu row is tapped
- **THEN** it navigates to a real destination or performs a real action; informational alert-only rows are not presented as navigation

#### Scenario: Unavailable action gives feedback
- **WHEN** an action is disabled because required setup is missing
- **THEN** tapping or focusing it explains what is missing instead of silently doing nothing

### Requirement: Aging strip signature

The app SHALL use one aging visual language with 0–30, 31–60, and 60+ day buckets. Home SHALL show a proportional strip of total outstanding money, and customer rows SHALL show a three-segment indicator with the bucket of the oldest unpaid credit highlighted. The strip, its legend, and every indicator derived from the same buckets SHALL share one color map.

#### Scenario: Aggregate strip reflects real rupees
- **WHEN** Home displays total outstanding money
- **THEN** the strip segments are proportional to the rupees in each aging bucket

#### Scenario: Customer indicator shows urgency
- **WHEN** a customer has an outstanding balance with an unpaid age
- **THEN** the three-segment indicator highlights the bucket containing the oldest unpaid credit and the row states the age in days

#### Scenario: Legend appears once
- **WHEN** Home displays top debtors
- **THEN** a single legend explains the aging buckets and urgency is also communicated in text

#### Scenario: No balance
- **WHEN** a customer has no outstanding balance
- **THEN** no aging indicator is shown for that customer

#### Scenario: Strip and legend share one color map
- **WHEN** Home renders the aging strip and its legend
- **THEN** each bucket uses the same color in the strip and in the legend

### Requirement: Interaction feedback and accessibility

Every pressable element SHALL show a visible pressed state, transitions SHALL respect reduced-motion settings, touch targets SHALL be at least 44x44 points, and icon-only controls SHALL provide accessible labels. Every pressable SHALL expose an accessible role and, where it changes state, an accessible state. Asynchronous status SHALL be announced. A control SHALL NOT expose a progress role without a determinate value.

#### Scenario: Press feedback
- **WHEN** the user presses a button, row, tab, or filter
- **THEN** the element shows a visible pressed or active state before navigation or submission

#### Scenario: Touch target size
- **WHEN** a control renders, including icon-only header actions
- **THEN** its tappable area is at least 44x44 points

#### Scenario: Reduced motion
- **WHEN** the device requests reduced motion
- **THEN** non-essential transitions are removed while state changes remain visible

#### Scenario: Color-independent meaning
- **WHEN** a user cannot distinguish the money colors
- **THEN** signs, labels, and text still communicate whether money is owed or received

#### Scenario: Controls expose role and state
- **WHEN** a pressable renders
- **THEN** it exposes an accessible role
- **AND** a toggle or selection control exposes its selected state

#### Scenario: Async status is announced
- **WHEN** the sync state, lock state, or a queued write changes
- **THEN** the change is announced to assistive technology

#### Scenario: No indeterminate progress role
- **WHEN** a control exposes a progress role
- **THEN** it also exposes a determinate value

### Requirement: Every screen states its loading, empty and error condition

Each screen SHALL render a loading state, an empty state, and an error state for the data it shows. A failed request SHALL NOT be presented as an empty result, and a rejected input SHALL NOT be silently ignored.

#### Scenario: Failure is shown, not logged

- **WHEN** a screen's data request fails
- **THEN** the screen shows an error state
- **AND** it does not present the failure as "nothing to show"

#### Scenario: Empty state offers the next action

- **WHEN** a screen has no data
- **THEN** it states what is missing and offers the action that creates it

#### Scenario: Rejected input is visible

- **WHEN** the user submits an invalid amount
- **THEN** the input is rejected visibly with a message
- **AND** the interface does not appear to accept the action while doing nothing

### Requirement: One shared session, settings and queue state

The app SHALL hold one session, one settings value, and one offline queue for the running app, so that a queued write is replayed exactly once and every screen reports the same account and queue state.

#### Scenario: Session is resolved once

- **WHEN** the app starts and several screens mount
- **THEN** the account session is fetched once and shared by every screen

#### Scenario: A queued write is replayed once

- **WHEN** the device reconnects with queued writes pending
- **THEN** the queue is replayed exactly once per queued item
- **AND** no duplicate transaction is created

#### Scenario: Queue counts match the pending bar

- **WHEN** the pending-sync bar shows a count of queued items
- **THEN** that count equals the number of items still awaiting sync

### Requirement: Forms validate visibly

Every input SHALL have a visible label, validation errors SHALL appear next to the field they belong to and SHALL be announced, and a successful save SHALL be confirmed on the screen.

#### Scenario: Inputs have visible labels

- **WHEN** a form renders an input
- **THEN** a visible label names it and is programmatically associated with it

#### Scenario: Errors sit next to their field

- **WHEN** an input fails validation
- **THEN** the message appears next to that input and is announced

#### Scenario: Success is confirmed

- **WHEN** a record is saved successfully
- **THEN** the screen confirms the save before leaving
