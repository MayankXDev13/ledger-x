# Spec Delta

## MODIFIED Requirements

### Requirement: Full and partial payments reduce the balance

Recording a payment SHALL be expressed as a debit entry against a customer, and the customer's outstanding balance SHALL decrease by the recorded amount immediately after the mutation. Partial amounts SHALL be accepted, and a payment larger than the outstanding balance SHALL be accepted and reported as a negative balance (advance) rather than rejected. Amounts SHALL be expressed in whole rupees, which is the unit the ledger stores.

#### Scenario: Partial payment reduces the balance exactly

- **WHEN** a customer owes 1,000 and the user records a 400 payment
- **THEN** the customer's outstanding balance becomes 600
- **AND** the payment appears in the customer's transaction history

#### Scenario: Overpayment is recorded as an advance

- **WHEN** a customer owes 300 and the user records a 500 payment
- **THEN** the API accepts the payment
- **AND** the customer's balance becomes -200, displayed as an advance

#### Scenario: Invalid payment amount is rejected

- **WHEN** a user submits a payment amount that is zero, negative, or not a whole number of rupees
- **THEN** the API responds `400` with a validation error
- **AND** no transaction is created

#### Scenario: A fractional amount names the unit

- **WHEN** a client submits a payment amount of 1250.50
- **THEN** the API responds `400` with a field-level error for the amount
- **AND** the error message states that the amount must be a whole number of rupees

## ADDED Requirements

### Requirement: Clients submit amounts in whole rupees

Every client SHALL validate a transaction amount against the ledger unit before submitting it, and SHALL refuse to send an amount that is not a whole number of rupees. A refused amount SHALL be reported to the user inline, in the language of the screen that collected it, and no write SHALL be attempted.

#### Scenario: A fractional amount is refused before submission

- **WHEN** a user enters an amount with paise in a transaction form
- **THEN** the form reports that the amount must be a whole number of rupees
- **AND** no request is sent to the API

#### Scenario: A whole amount is accepted

- **WHEN** a user enters a whole number of rupees
- **THEN** the form submits that amount unchanged

#### Scenario: The mobile entry points behave the same

- **WHEN** a user enters a fractional amount in the mobile add, quick-entry or edit screen
- **THEN** the screen reports that the amount must be a whole number of rupees
- **AND** nothing is queued for replay

### Requirement: A rejected write is reported to the user

When the API rejects a transaction write, the client SHALL tell the user that the write was rejected and SHALL show the server's error message together with any field-level detail, and SHALL NOT present the rejected write as a recorded entry.

#### Scenario: Web shows the server message and field detail

- **WHEN** the API rejects a transaction write with `400` and a field-level detail
- **THEN** the web client shows the error message and the field detail
- **AND** it does not show a generic message such as "Validation failed" on its own

#### Scenario: Mobile does not announce a rejected write as recorded

- **WHEN** the API rejects a transaction write that the mobile app submitted
- **THEN** the recording screen reports the rejection with the server's message
- **AND** the app does not announce the entry as recorded
