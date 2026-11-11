# Spec Delta

## Purpose

Gives every user a default ledger book and scopes all customers and transactions to a book, so the product stays single-book today while the schema supports multiple books later.

## ADDED Requirements

### Requirement: Default book per user

The system SHALL create exactly one default book for each user, and every book SHALL be owned by exactly one user. The API SHALL expose the user's book via `GET /books`, including a `default` marker, and repeated access SHALL NOT create duplicate default books.

#### Scenario: New user receives a default book

- **WHEN** a newly signed-in user requests `GET /books`
- **THEN** exactly one book is returned
- **AND** it is marked as the user's default book

#### Scenario: Default book creation is idempotent

- **WHEN** the same user requests `GET /books` multiple times
- **THEN** the same single default book is returned every time
- **AND** no additional book is created

### Requirement: Resources belong to a book

Every customer and transaction SHALL belong to exactly one book owned by the authenticated user. Write requests that reference a book or customer owned by another user SHALL return `404` with the JSON error envelope and SHALL NOT create or change data. Existing rows SHALL be backfilled to their owner's default book by the migration.

#### Scenario: Existing data is backfilled

- **WHEN** the books migration runs
- **THEN** every existing customer and transaction is assigned its owner's default book
- **AND** no row is left without a book

#### Scenario: Cross-user book reference is rejected

- **WHEN** an authenticated client references another user's book
- **THEN** the API responds `404` with the JSON error envelope
- **AND** no data is created or changed

### Requirement: Single-book experience

The web and mobile clients SHALL operate on the user's default book only. Creating, renaming, switching, or deleting books SHALL NOT be exposed in this change, and newly created customers and transactions SHALL land in the default book.

#### Scenario: No book management UI

- **WHEN** a signed-in user navigates the web or mobile app
- **THEN** no book switcher or book management screen is present

#### Scenario: New entries land in the default book

- **WHEN** a user creates a customer or transaction
- **THEN** the record belongs to the user's default book
