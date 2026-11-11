# Spec Delta

## Purpose

Defines the observable five-tab shopkeeper UI contract for the Ledger-X mobile app so Home, Ledger, Collection, Customers, and Profile match the approved dark + orange mockups while reusing existing backend data.

## ADDED Requirements

### Requirement: Home dashboard metric cards and greeting

The Home screen SHALL show greeting header `Ledger-X` with notification affordance, `Welcome back to Ledger-X` subtitle, and a 2x2 grid of metric cards: Total Balance, Total Customers, This Month, To Collect, each with icon, formatted INR value, and label.

#### Scenario: Metrics render from existing endpoints
- **WHEN** dashboard metrics and analytics load successfully
- **THEN** the four cards show Total Balance, Total Customers, monthly net, and total receivables with INR formatting

#### Scenario: Loading and error states
- **WHEN** metrics are loading or fail
- **THEN** cards show skeleton/placeholder and retry via pull-to-refresh without crashing

### Requirement: Home quick credit/payment actions and method selector

The Home screen SHALL provide a solid-orange `+ Credit` button, an outlined `+ Payment` button, and a Cash/UPI/Other segmented selector that routes into the existing QuickEntry flow with the chosen method pre-selected.

#### Scenario: Quick entry entry points
- **WHEN** user taps + Credit or + Payment
- **THEN** the existing QuickEntry modal opens with credit/debit type and selected payment method

#### Scenario: Method selector persistence for session
- **WHEN** user switches Cash/UPI/Other segment
- **THEN** the selection is used as default for the next quick entry in that session

### Requirement: Home 12-month trend and top debtors

The Home screen SHALL show a 12-Month Trend chart with Credit vs Paid legend and month labels, and a Top Debtors list with `View All` link to Customers, each row showing avatar initial, name, `Unpaid Nd`, and outstanding amount.

#### Scenario: Trend with data
- **WHEN** analytics trend contains non-zero months
- **THEN** chart plots Credit (orange) and Paid (green) series with Jan/Mar/May/Jul/Sep/Nov labels

#### Scenario: Empty trend and debtors
- **WHEN** no activity or no outstanding balances exist
- **THEN** trend shows empty placeholder and debtors show `No outstanding balances`

#### Scenario: Debtor navigation
- **WHEN** user taps a debtor row or View All
- **THEN** app navigates to customer details or Customers list

### Requirement: Ledger filter and transaction list

The Ledger screen SHALL show header with search affordance, All/Credit/Payment filter pills (All = solid orange when active), and a transaction list where each row shows blue-circle avatar initial, customer name, note type (Credit Note / Payment Received / UPI Payment), green `+` amount for credits and red `-` amount for payments, and date.

#### Scenario: Filter behavior
- **WHEN** user selects Credit or Payment pill
- **THEN** list shows only matching entry types; All restores full recent list

#### Scenario: Row navigation
- **WHEN** user taps a ledger row
- **THEN** app opens that customer's details/statement view

#### Scenario: Empty ledger
- **WHEN** no transactions exist
- **THEN** screen shows empty illustration with guidance to add from Customers

### Requirement: Collection scan-to-pay hero

The Collection screen SHALL show an orange-bordered hero card with scan icon, `Scan to Pay` title, `Let customers scan and pay via UPI` subtitle, centered white QR encoding the shop UPI `upi://pay` URI, `OR` divider, and `Share QR Code` outlined button.

#### Scenario: QR encodes shop UPI intent
- **WHEN** UPI ID is configured in settings
- **THEN** QR value is a valid `upi://pay` URI with payee ID and name

#### Scenario: UPI not configured
- **WHEN** no UPI ID is set
- **THEN** hero shows setup guidance linking to Profile Payment Settings instead of a scannable QR

#### Scenario: Share action
- **WHEN** user taps Share QR Code
- **THEN** OS share sheet opens with QR image/link

### Requirement: Collection quick actions

The Collection screen SHALL show a Quick Actions card with three rows: Copy UPI ID, Download QR, Print QR, each with icon and chevron.

#### Scenario: Copy UPI ID
- **WHEN** user taps Copy UPI ID
- **THEN** UPI ID is copied to clipboard and confirmation is shown

#### Scenario: Download and print
- **WHEN** user taps Download QR or Print QR
- **THEN** QR image is saved to device or sent to print/share target, with error toast on failure

### Requirement: Customers search and debtor list

The Customers screen SHALL show header with search affordance, a `Search customers...` input with filter icon, and rows with blue-circle avatar initial, name, `Unpaid Nd` in orange (or phone when settled), outstanding INR amount, and chevron.

#### Scenario: Search filters by name or phone
- **WHEN** user types in search box
- **THEN** list filters case-insensitively by name substring or phone substring

#### Scenario: Row navigation and add
- **WHEN** user taps a customer row
- **THEN** app opens customer details; FAB/add affordance remains reachable when list is long

#### Scenario: Empty search result
- **WHEN** filter matches nothing
- **THEN** screen shows `No customers found` state

### Requirement: Profile shop header and menu

The Profile screen SHALL show header with settings gear, centered shop avatar, `My Shop` name, `Ledger-X User` subtitle, and menu rows: Business Details, Payment Settings, Share App, Help & Support, About Ledger-X, Logout (red), each with icon and chevron.

#### Scenario: Menu navigation
- **WHEN** user taps Business Details or Payment Settings
- **THEN** app opens the existing UPI/settings form or business form

#### Scenario: Logout and share
- **WHEN** user taps Logout or Share App
- **THEN** app signs out via existing session flow or opens OS share sheet respectively

### Requirement: Profile growth promo card

The Profile screen SHALL show a `Grow Your Business with Ledger-X` promo card with chart icon, `Keep track, collect faster, and manage better.` copy below the menu.

#### Scenario: Promo is informational
- **WHEN** Profile loads
- **THEN** promo card is visible without blocking menu actions and has no destructive side effects

### Requirement: Global tab bar and dark-orange theme

The app SHALL provide a five-tab bottom bar (Home, Ledger, Collection, Customers, Profile) with dark background, orange active tint, muted inactive tint, and focused/unfocused icons, preserving existing route names.

#### Scenario: Active tab indication
- **WHEN** user is on any of the five tabs
- **THEN** that tab shows orange label/icon while others show muted style

#### Scenario: Theme consistency
- **WHEN** any of the five screens render
- **THEN** background is near-black, cards use dark surfaces except Quick Actions (white per mock), primary actions use orange, semantic green/red are preserved for credit/paid amounts
