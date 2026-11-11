# Spec Delta

## MODIFIED Requirements

### Requirement: Global tab bar and dark-orange theme

The app SHALL provide a five-tab bottom bar (Home, Ledger, Collection, Customers, Profile) with a dark background, orange active tint, muted inactive tint, and focused/unfocused icons, preserving existing route names. The Collection tab SHALL be omitted while the feature flag that gates the collection view is disabled, and the remaining tabs SHALL keep their order, appearance and behaviour.

#### Scenario: Active tab indication
- **WHEN** user is on any of the five tabs
- **THEN** that tab shows orange label/icon while others show muted style

#### Scenario: Theme consistency
- **WHEN** any of the five screens render
- **THEN** the background is near-black, content sits on dark surfaces, primary actions use orange, and emerald appears only on money received

#### Scenario: The Collection tab follows its flag
- **WHEN** the feature flag that gates the collection view is disabled
- **THEN** the bottom bar shows the remaining tabs without a Collection tab
- **AND** the remaining tabs keep their order and active indication

#### Scenario: The Collection tab returns when the flag is enabled
- **WHEN** the feature flag that gates the collection view is enabled again
- **THEN** the bottom bar shows the Collection tab again

### Requirement: Profile identity and sections

The Profile screen SHALL show the signed-in account's identity rather than placeholder copy, and SHALL separate identity, payment settings and the destructive session actions into distinct sections. The payment settings section SHALL be omitted while the feature flag that gates the UPI configuration is disabled, and the remaining sections SHALL be unaffected.

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

## ADDED Requirements

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
