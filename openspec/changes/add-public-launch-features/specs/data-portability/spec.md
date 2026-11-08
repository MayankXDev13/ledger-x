# Spec Delta

## Purpose

Gives users their own ledger data on demand — CSV export, a complete account data download, and self-serve account deletion — so data is never trapped in the product.

## ADDED Requirements

### Requirement: CSV export of ledger data

A signed-in user SHALL be able to export their customers and transactions as UTF-8 CSV files with a header row. Each file SHALL contain only the authenticated user's non-deleted non-sample records, with timestamps in ISO 8601 and amounts expressed in whole currency units with two decimal places.

#### Scenario: Export contains the user's records

- **WHEN** a user exports their data
- **THEN** the customers file contains every non-deleted customer they own
- **AND** the transactions file contains every non-deleted transaction they own with customer reference, type, amount, method, note, and timestamp

#### Scenario: CSV opens in a spreadsheet

- **WHEN** the exported files are opened in a spreadsheet application
- **THEN** columns are separated correctly and the header row labels each column

#### Scenario: Export requires authentication

- **WHEN** an unauthenticated client requests an export
- **THEN** the API responds `401` with the JSON error envelope
- **AND** no data is returned

### Requirement: Full account data download

A signed-in user SHALL be able to download a complete archive of the data they own, including soft-deleted records marked as deleted, so nothing about their account is hidden from them.

#### Scenario: Archive includes every owned record

- **WHEN** a user downloads their account data
- **THEN** the archive contains all customers and transactions they own, including soft-deleted ones marked as deleted

#### Scenario: Archive excludes other users' data

- **WHEN** a user downloads their account data
- **THEN** no record owned by another user is present in the archive

### Requirement: Self-serve account deletion

A signed-in user SHALL be able to delete their account after an explicit confirmation step. Deletion SHALL remove or irreversibly anonymize the user's identity, sessions, customers, and transactions, SHALL make further sign-in impossible for that account, and SHALL leave other users' data untouched.

#### Scenario: Account is deleted after confirmation

- **WHEN** a user confirms account deletion
- **THEN** the account can no longer sign in
- **AND** the user's customers and transactions are no longer accessible through the API

#### Scenario: Confirmation is required

- **WHEN** a user requests account deletion without the explicit confirmation step
- **THEN** the deletion is refused
- **AND** the account and data remain intact

#### Scenario: Other users are unaffected

- **WHEN** one account is deleted
- **THEN** every other user's customers, transactions, and sessions remain unchanged
