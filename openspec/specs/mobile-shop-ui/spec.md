# mobile-shop-ui Specification

## Purpose

Defines the observable five-tab shopkeeper UI contract for the Ledger-X mobile app so Home, Ledger, Collection, Customers, and Profile match the approved dark + orange mockups while reusing existing backend data.

## Requirements

### Requirement: Home 12-month trend and top debtors

The Home screen SHALL show a 12-Month Trend chart with a labelled Credit-versus-Paid legend and month labels, and a Top Debtors list with a `View All` link to Customers, each row showing an avatar initial, name, unpaid age and outstanding amount.

#### Scenario: Trend with data
- **WHEN** analytics trend contains non-zero months
- **THEN** the chart plots Credit as a neutral series and Paid as the emerald series, with the series distinguished by fill pattern and label as well as colour

#### Scenario: Empty trend and debtors
- **WHEN** no activity or no outstanding balances exist
- **THEN** trend shows empty placeholder and debtors show `No outstanding balances`

#### Scenario: Debtor navigation
- **WHEN** user taps a debtor row or View All
- **THEN** app navigates to customer details or Customers list

### Requirement: Ledger filter and transaction list

The Ledger screen SHALL show a header with an inline search field, All/Credit/Payment filter tabs with counts, and a transaction list where each row shows a neutral avatar initial, customer name, note type, a signed amount in neutral ink for credit and the positive token for a received payment, and the date.

#### Scenario: Filter behavior
- **WHEN** user selects Credit or Payment tab
- **THEN** list shows only matching entry types and the count on each tab; All restores the full recent list

#### Scenario: Row navigation
- **WHEN** user taps a ledger row
- **THEN** app opens that customer's details/statement view

#### Scenario: Empty ledger
- **WHEN** no transactions exist
- **THEN** screen shows empty illustration with guidance to add from Customers

### Requirement: Collection scan-to-pay hero

The Collection screen SHALL show a `Scan to Pay` hero with the shop UPI intent encoded in a QR code on a white scanning plate, and SHALL explain that payment completion is recorded manually in the customer ledger. The hero SHALL be omitted while the feature flag that gates the UPI configuration is disabled.

#### Scenario: QR encodes shop UPI intent
- **WHEN** UPI ID is configured in settings
- **THEN** QR value is a valid `upi://pay` URI with payee ID and name

#### Scenario: UPI not configured
- **WHEN** no UPI ID is set
- **THEN** hero shows setup guidance linking to Profile Payment Settings instead of a scannable QR

#### Scenario: Share action
- **WHEN** user taps the share action
- **THEN** OS share sheet opens with the QR image

#### Scenario: The hero follows its flag
- **WHEN** the feature flag that gates the UPI configuration is disabled
- **THEN** the Collection screen does not render the scan-to-pay hero or the QR quick actions
- **AND** the outstanding receivables list is still shown

### Requirement: Collection quick actions

The Collection screen SHALL show a Quick actions section on the dark surface with three rows — Copy UPI ID, Download QR and Print QR — each with an icon, and SHALL NOT present them inside a white content card.

#### Scenario: Copy UPI ID
- **WHEN** user taps Copy UPI ID
- **THEN** UPI ID is copied to clipboard and confirmation is shown

#### Scenario: Download and print
- **WHEN** user taps Download QR or Print QR
- **THEN** QR image is saved to device or sent to print/share target, with error toast on failure

### Requirement: Customers search and debtor list

The Customers screen SHALL show a header with an inline search field, and rows with a neutral avatar initial, name, the unpaid age where a balance exists, the outstanding INR amount, and a chevron.

#### Scenario: Search filters by name or phone
- **WHEN** user types in search box
- **THEN** list filters case-insensitively by name substring or phone substring

#### Scenario: Row navigation and add
- **WHEN** user taps a customer row
- **THEN** app opens customer details; FAB/add affordance remains reachable when list is long

#### Scenario: Empty search result
- **WHEN** filter matches nothing
- **THEN** screen shows `No customers found` state

### Requirement: Global tab bar and dark-orange theme

The app SHALL provide a five-tab bottom bar (Home, Ledger, Collection, Customers, Profile) with a dark background, orange active tint, muted inactive tint, and focused/unfocused icons, preserving existing route names. The Collection tab SHALL be omitted while the feature flag that gates the collection view is disabled, and the remaining tabs SHALL keep their order, appearance and behaviour. The bottom tab bar SHALL reserve height and padding for the device bottom safe area insets so that tab icons and text labels are never clipped by the display edge or system navigation bar.

#### Scenario: Active tab indication
- **WHEN** user is on any of the five tabs
- **THEN** that tab shows orange label/icon while others show muted style

#### Scenario: Theme consistency
- **WHEN** any of the five screens render
- **THEN** the background is near-black, content sits on dark surfaces, primary actions use orange, and emerald appears only on money received

#### Scenario: Tab bar adapts to Android safe area
- **WHEN** the app runs on an Android device with gestures or 3-button navigation
- **THEN** the tab bar accommodates the bottom inset with at least 12px padding and sufficient total height
- **AND** tab icons and labels remain completely visible above the system navigation bar

#### Scenario: The Collection tab follows its flag
- **WHEN** the feature flag that gates the collection view is disabled
- **THEN** the bottom bar shows the remaining tabs without a Collection tab
- **AND** the remaining tabs keep their order and active indication

#### Scenario: The Collection tab returns when the flag is enabled
- **WHEN** the feature flag that gates the collection view is enabled again
- **THEN** the bottom bar shows the Collection tab again

### Requirement: Home hero, greeting and supporting stats

The Home screen SHALL greet the signed-in user by name, present total outstanding money as a single hero figure with the proportional aging strip and its legend beneath it, and follow it with one inline row of supporting stats (Customers, This month, Net balance) separated by hairlines rather than a grid of metric cards.

#### Scenario: Hero renders from existing endpoints
- **WHEN** dashboard metrics and analytics load successfully
- **THEN** the hero shows total outstanding with INR formatting, the aging strip segments are proportional to the rupees in each bucket, and the supporting row shows customer count, monthly net and net balance

#### Scenario: Oldest unpaid is stated in text
- **WHEN** a receivable is outstanding
- **THEN** the screen states the age of the oldest unpaid credit in days alongside the aging legend

#### Scenario: Loading and error states
- **WHEN** metrics are loading or fail
- **THEN** the screen reserves the hero's layout, shows a skeleton or an error state with a retry, and does not present the failure as an empty ledger

### Requirement: Home quick credit and payment actions

The Home screen SHALL provide a solid-orange `+ Credit` action and an outlined `+ Payment` action that route into the existing QuickEntry flow, with the payment method chosen in the quick-entry modal rather than on the Home screen.

#### Scenario: Quick entry entry points
- **WHEN** user taps + Credit or + Payment
- **THEN** the existing QuickEntry modal opens with the credit or debit type, and its own Cash/UPI/Other selector sets the method

### Requirement: Profile identity and sections

The Profile screen SHALL show the signed-in account's identity rather than placeholder copy, and SHALL separate identity, payment settings, sample data, app lock, invite, account deletion, and destructive session actions into distinct sections. The payment settings, sample data, and account deletion sections SHALL be omitted while their respective feature flags are disabled, and the remaining sections SHALL be unaffected.

#### Scenario: Real identity
- **WHEN** Profile loads for a signed-in user
- **THEN** the header reflects that user's account rather than a hardcoded shop name

#### Scenario: Payment settings are a form
- **WHEN** the user opens the payment settings section
- **THEN** the UPI ID and payee name are editable in a labelled form that rejects an invalid UPI ID with an inline message

#### Scenario: Account deletion is guarded
- **WHEN** the user chooses to delete the account
- **THEN** deletion requires a separate confirmation with an explicit typed confirmation and cannot be triggered by a single tap

#### Scenario: Payment settings follow their flag
- **WHEN** the feature flag that gates the UPI configuration is disabled
- **THEN** the Profile screen does not render the payment settings section
- **AND** the identity, export, app lock, sample data, invite, account and session sections are unchanged

#### Scenario: Sample data follows its flag
- **WHEN** the `sample_data` feature flag is disabled
- **THEN** the Profile screen does not render the Sample data section

#### Scenario: Account deletion follows its flag
- **WHEN** the `account_deletion` feature flag is disabled
- **THEN** the Profile screen does not render the Delete account section

### Requirement: Screens refresh when they regain focus

A screen that displays transactions SHALL refresh its data when it regains focus, so that an entry recorded a moment earlier is visible without the user pulling to refresh or navigating away and back.

#### Scenario: The customer detail screen refreshes on focus

- **WHEN** the user returns to a customer's detail screen after recording a transaction for that customer
- **THEN** the screen reloads the customer's transactions and totals
- **AND** the newly recorded entry is listed

#### Scenario: The collection screen refreshes on focus

- **WHEN** the user returns to the Collection screen after recording a transaction
- **THEN** the outstanding list reloads and shows the new balance

#### Scenario: A refresh does not discard the current view

- **WHEN** a screen refreshes on focus
- **THEN** the current filters and sort order are kept
- **AND** the screen shows its loading and empty states as it does on a manual refresh

### Requirement: Customer detail action buttons layout

The customer detail screen SHALL provide ledger and communication actions structured into a two-row hierarchy rather than cramming five buttons into one row. The primary row SHALL display `+ Credit` and `Payment` as prominent actions. The secondary row SHALL display `Statement`, `WhatsApp`, and `SMS` utility actions. Action button text labels SHALL NOT wrap onto multiple lines.

#### Scenario: Two-row action layout
- **WHEN** the customer detail screen loads
- **THEN** primary actions (Credit and Payment) sit in the top action row
- **AND** communication actions (Statement, WhatsApp, SMS) sit in the secondary action row
- **AND** every label renders on a single line without wrapping

#### Scenario: WhatsApp button appearance
- **WHEN** the WhatsApp action renders
- **THEN** it displays the WhatsApp logo icon with WhatsApp-branded green accents rather than generic orange tint

### Requirement: Edit transaction destructive action

The edit transaction view SHALL provide a clearly structured destructive button for deleting a transaction, styled with horizontal alignment, comfortable touch padding, and explicit confirmation.

#### Scenario: Delete button styling
- **WHEN** the user opens the Edit Transaction dialog
- **THEN** the delete button displays an inline trash icon beside the label "Delete Transaction"
- **AND** the control is rendered as a cohesive, styled destructive button rather than an unstyled vertical stack

### Requirement: Dark transitions and loaders without white flash

The application root container, navigation stack screen options, and screen loading states SHALL render on the dark background (`#121212`) so that navigation transitions between screens and tabs never display a white flash or unstyled background.

#### Scenario: Navigating into customer details
- **WHEN** a user taps a customer row to navigate to the customer detail screen
- **THEN** the transition and initial loading state display on the dark theme background
- **AND** no white screen flash occurs during data fetching
