# Spec Delta

## MODIFIED Requirements

### Requirement: Conflict and failure handling

A permanent server rejection (validation error or missing resource) SHALL surface as a failed queue item that the user can review and retry or discard, rather than being silently dropped. Transient failures SHALL remain queued and retry automatically, and per-customer submission order SHALL be preserved during replay. A rejection that occurs while the write is being submitted SHALL be reported to the screen that submitted it, and SHALL NOT be reported to that screen as a success.

#### Scenario: Rejected queued write is visible
- **WHEN** a queued transaction is rejected because its customer no longer exists
- **THEN** the item is shown as failed with the server's error message
- **AND** the user can discard it or retry

#### Scenario: Interrupted replay resumes without duplicates
- **WHEN** connectivity drops in the middle of replaying several writes
- **THEN** replay resumes on reconnect
- **AND** no already-accepted write is duplicated

#### Scenario: A rejection at submission time reaches the user
- **WHEN** a user submits a transaction while online and the server rejects it
- **THEN** the screen that submitted it reports the rejection with the server's error message
- **AND** the app does not announce the entry as recorded

## ADDED Requirements

### Requirement: A pending or synced write is visible where it belongs

A transaction that is queued but not yet accepted by the server SHALL be visible in the views that display that customer's transactions, including the collection view, and SHALL be marked as pending rather than as confirmed. A write that has been accepted by the server SHALL be visible in those views without a manual refresh.

#### Scenario: A queued credit shows in the collection view

- **WHEN** a credit for an existing customer is queued and not yet synced
- **THEN** the collection outstanding list shows that customer with the queued amount included
- **AND** the queued amount is marked as pending

#### Scenario: A synced write appears without a manual refresh

- **WHEN** a queued transaction is accepted by the server
- **THEN** the customer detail, ledger, collection and dashboard views show it without the user pulling to refresh

#### Scenario: A pending entry does not disappear

- **WHEN** a queued entry has been accepted by the server
- **THEN** it is not dropped from the list before the list is refreshed from the server
