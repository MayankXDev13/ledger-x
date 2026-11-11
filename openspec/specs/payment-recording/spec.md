# payment-recording Specification

## Purpose

Lets users record full or partial payments received from customers, together with how the money was received, so balances and history reflect real money movement.

## Requirements

### Requirement: Payment method on transactions

Every transaction SHALL accept a payment method of `cash`, `upi`, or `other`, and transactions without one SHALL report a `null` method displayed as "unspecified". Write requests with any other method value SHALL return `400` with the JSON error envelope. Historical rows created before this change SHALL keep a `null` method and remain readable.

#### Scenario: Payment method is persisted

- **WHEN** a user records an entry with payment method `upi`
- **THEN** the created transaction response includes `upi` as its payment method
- **AND** later reads of that transaction return `upi`

#### Scenario: Invalid payment method is rejected

- **WHEN** a client submits a payment method other than `cash`, `upi`, or `other`
- **THEN** the API responds `400` with a validation error for that field
- **AND** no transaction is created

#### Scenario: Legacy entries stay readable

- **WHEN** a user reads a transaction created before payment methods existed
- **THEN** the transaction is returned with a `null` payment method
- **AND** the client displays it as "unspecified" without error

### Requirement: Full and partial payments reduce the balance

Recording a payment SHALL be expressed as a debit entry against a customer, and the customer's outstanding balance SHALL decrease by the recorded amount immediately after the mutation. Partial amounts SHALL be accepted, and a payment larger than the outstanding balance SHALL be accepted and reported as a negative balance (advance) rather than rejected.

#### Scenario: Partial payment reduces the balance exactly

- **WHEN** a customer owes 1,000 and the user records a 400 payment
- **THEN** the customer's outstanding balance becomes 600
- **AND** the payment appears in the customer's transaction history

#### Scenario: Overpayment is recorded as an advance

- **WHEN** a customer owes 300 and the user records a 500 payment
- **THEN** the API accepts the payment
- **AND** the customer's balance becomes -200, displayed as an advance

#### Scenario: Invalid payment amount is rejected

- **WHEN** a user submits a payment amount that is zero, negative, or not an integer number of minor currency units
- **THEN** the API responds `400` with a validation error
- **AND** no transaction is created

### Requirement: Payment history is distinguishable

Customer and ledger views SHALL distinguish payment entries from credit entries by type, amount, payment method, and date, so a user can see when and how money was received.

#### Scenario: Payment entry is labeled in history

- **WHEN** a user views a customer's transaction history containing a payment
- **THEN** the payment row shows its amount, method, and date
- **AND** it is visually distinguishable from a credit entry

#### Scenario: Payment totals are included in aggregates

- **WHEN** a customer detail view loads totals
- **THEN** recorded payments are included in the debit total and net balance
- **AND** summary values remain equal to whole-customer server aggregates
