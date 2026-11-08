# Spec Delta

## Purpose

Produces a shareable record of a customer's ledger — entries, totals, and balance — that a shopkeeper can send to the customer over WhatsApp or keep as proof of account.

## ADDED Requirements

### Requirement: Generate a statement for an owned customer

A signed-in user SHALL be able to generate a statement for any customer they own, covering the full history by default or a selectable date range. The statement SHALL contain the customer's name and phone, the period, each non-deleted entry with date, type, amount, payment method when present, and running balance, plus period totals and an opening and closing balance.

#### Scenario: Full-history statement

- **WHEN** a user generates a statement for a customer with ten entries and no date range
- **THEN** the statement lists all ten non-deleted entries in chronological order
- **AND** its closing balance equals the customer's current outstanding balance

#### Scenario: Date-range statement carries an opening balance

- **WHEN** a user generates a statement for a partial date range
- **THEN** only entries inside the range are listed
- **AND** the opening balance equals the customer's balance immediately before the range

#### Scenario: Deleted entries are excluded

- **WHEN** the customer has soft-deleted entries
- **THEN** none of them appear in the statement or its totals

### Requirement: Share and download statements

The generated statement SHALL be available as a PDF and an image. On mobile it SHALL be shareable through the operating system share sheet so it can be sent to WhatsApp or another app; on web it SHALL be downloadable and printable. The file name SHALL identify the customer and the statement period.

#### Scenario: Mobile share opens the system sheet

- **WHEN** a user taps share on a mobile statement
- **THEN** the operating system share sheet opens with the statement file attached

#### Scenario: Web download yields a usable file

- **WHEN** a user downloads a statement on the web
- **THEN** a PDF named for the customer and period is saved
- **AND** it contains the same entries and totals shown on screen

### Requirement: Statement access is ownership-scoped

Statement generation for a customer that does not exist or is owned by another user SHALL return `404` with the JSON error envelope and SHALL NOT reveal that customer's data.

#### Scenario: Another user's customer is not accessible

- **WHEN** an authenticated client requests a statement for a customer owned by another user
- **THEN** the API responds `404` with the JSON error envelope
- **AND** no statement content is returned
