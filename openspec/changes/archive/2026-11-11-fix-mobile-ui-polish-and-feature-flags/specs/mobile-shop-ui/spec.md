# Spec Delta: mobile-shop-ui

## MODIFIED Requirements

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

## ADDED Requirements

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
