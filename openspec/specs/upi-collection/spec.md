# upi-collection Specification

## Purpose

Lets a user configure their UPI payment address and turn any outstanding customer balance into a one-tap payment request, without the app ever moving or holding money.

## Requirements

### Requirement: Configure the user's UPI address

A signed-in user SHALL be able to save, update, and view their own UPI ID (VPA) and payee name. A VPA SHALL be validated against the `handle@provider` shape, invalid values SHALL return `400` with the JSON error envelope, and no user SHALL read or change another user's UPI configuration. While the feature flag that gates the UPI configuration is disabled, the API SHALL NOT return the UPI ID or payee name and SHALL reject writes to those fields.

#### Scenario: Valid UPI ID is saved
- **WHEN** a user saves a UPI ID in valid `handle@provider` form
- **THEN** it is persisted and returned on subsequent reads by that user

#### Scenario: Invalid UPI ID is rejected
- **WHEN** a user submits a UPI ID without a provider part
- **THEN** the API responds `400` with a validation error
- **AND** the stored configuration is unchanged

#### Scenario: Other users cannot access the configuration
- **WHEN** a user requests another user's UPI configuration
- **THEN** the API responds `404` or `401` with the JSON error envelope
- **AND** no UPI ID is exposed

#### Scenario: The configuration is withheld while its flag is disabled
- **WHEN** the feature flag that gates the UPI configuration is disabled
- **THEN** the settings response omits the UPI ID and the payee name
- **AND** the stored values are left untouched

#### Scenario: Writing the configuration is refused while its flag is disabled
- **WHEN** the feature flag that gates the UPI configuration is disabled and a client submits a UPI ID
- **THEN** the API responds `403` with the JSON error envelope
- **AND** the stored configuration is unchanged

### Requirement: UPI intent link and QR for an outstanding balance

For a customer with a positive outstanding balance, the system SHALL produce a UPI intent link and a QR code encoding the user's payee VPA and name, the amount in rupees prefilled with the outstanding balance (editable by the user), and a reference note. The app SHALL NOT initiate, confirm, or record payment automatically; recording a payment remains an explicit user action.

#### Scenario: Link prefills the outstanding amount

- **WHEN** a user requests a payment link for a customer who owes 1,250.00
- **THEN** the generated UPI intent link contains the payee VPA, payee name, and an amount of 1,250.00
- **AND** the QR code encodes the same intent

#### Scenario: Amount is editable before sharing

- **WHEN** the user changes the prefilled amount before generating the link
- **THEN** the produced link and QR use the edited amount

#### Scenario: No request for a settled customer

- **WHEN** a customer's outstanding balance is zero or negative
- **THEN** no payment request link is offered for that customer
- **AND** the client explains that nothing is due

#### Scenario: UPI ID must be configured first

- **WHEN** a user without a saved UPI ID requests a payment link
- **THEN** the client directs them to configure their UPI ID
- **AND** no incomplete link is produced

### Requirement: Receivables collection view

The web and mobile apps SHALL provide a collection view listing only customers with a positive outstanding balance. Rows SHALL show the amount owed, the age of the oldest unpaid credit under first-in-first-out application of payments, and an action to create a payment request link.

#### Scenario: Only debtors are listed

- **WHEN** a user opens the collection view
- **THEN** customers with a positive outstanding balance are listed
- **AND** customers with zero or negative balances are not

#### Scenario: Ordering highlights the biggest and oldest debts

- **WHEN** the collection view loads
- **THEN** customers can be ordered by outstanding amount and by age of the oldest unpaid credit
- **AND** each row shows that age in days

#### Scenario: Collection data is ownership-scoped

- **WHEN** a user opens the collection view
- **THEN** only their own customers appear
- **AND** no other user's balances are included

### Requirement: The receivables collection view is gated by a feature flag

The collection view SHALL be gated by the feature flag that controls it. While that flag is disabled, the web app SHALL NOT render the navigation entry that leads to the collection view, the mobile app SHALL NOT render the Collection tab, neither client SHALL render the collection screen when its URL is opened, and the collection API route SHALL respond `404` with the JSON error envelope.

#### Scenario: The navigation entry is not rendered
- **WHEN** the collection feature flag is disabled
- **THEN** neither the web sidebar nor the mobile bottom bar links to the collection view

#### Scenario: The collection route is unavailable
- **WHEN** the collection feature flag is disabled
- **THEN** the collection API route responds `404` with the JSON error envelope

#### Scenario: The screen is not reachable
- **WHEN** the collection feature flag is disabled and a client requests the collection screen
- **THEN** the client does not render the collection screen

#### Scenario: Enabling the flag restores the view
- **WHEN** the collection feature flag is enabled again
- **THEN** the navigation entry is rendered again and the collection route answers normally

### Requirement: UPI payment request surfaces are gated by the UPI configuration flag

The UPI intent link and QR code SHALL be gated by the feature flag that controls the UPI configuration. While that flag is disabled, no UPI intent link or QR code SHALL be produced or displayed, and the client SHALL NOT direct the user to configure a UPI ID that the application will not use.

#### Scenario: No QR while the flag is disabled
- **WHEN** the feature flag that gates the UPI configuration is disabled
- **THEN** no UPI intent link and no QR code are produced or shown

#### Scenario: No setup prompt while the flag is disabled
- **WHEN** the feature flag that gates the UPI configuration is disabled
- **THEN** the client does not ask the user to configure a UPI ID
