# Spec Delta

## Purpose

Keeps mobile capture working when the device is offline by queuing writes locally and replaying them safely once connectivity returns.

## ADDED Requirements

### Requirement: Offline capture

While the mobile device has no usable network connection, the app SHALL accept newly submitted customers and transactions, persist them locally, and present them as pending rather than confirmed. The queue SHALL survive app restarts and SHALL NOT be cleared by a cold start.

#### Scenario: Entry is queued while offline

- **WHEN** a user with no connectivity records a transaction
- **THEN** the entry is stored locally and shown as pending
- **AND** it is not presented as server-confirmed

#### Scenario: Queue survives restart

- **WHEN** the user closes and reopens the app while still offline
- **THEN** previously queued entries are still present and pending

### Requirement: Idempotent replay

Queued writes SHALL replay automatically when connectivity returns, in their original submission order, and the server SHALL NOT create duplicate records when the same write is retried. Each queued write SHALL carry a client-generated identifier that the server uses to deduplicate retries.

#### Scenario: Queued entries sync exactly once

- **WHEN** connectivity returns after three queued entries
- **THEN** exactly three corresponding records exist on the server
- **AND** all three are marked as synced locally

#### Scenario: Retried write is deduplicated

- **WHEN** the client replays a write that the server already accepted
- **THEN** the server returns the existing record instead of creating a second one

### Requirement: Conflict and failure handling

A permanent server rejection (validation error or missing resource) SHALL surface as a failed queue item that the user can review and retry or discard, rather than being silently dropped. Transient failures SHALL remain queued and retry automatically, and per-customer submission order SHALL be preserved during replay.

#### Scenario: Rejected queued write is visible

- **WHEN** a queued transaction is rejected because its customer no longer exists
- **THEN** the item is shown as failed with the server's error message
- **AND** the user can discard it or retry

#### Scenario: Interrupted replay resumes without duplicates

- **WHEN** connectivity drops in the middle of replaying several writes
- **THEN** replay resumes on reconnect
- **AND** no already-accepted write is duplicated

### Requirement: Stale reads are labeled

While offline, cached reads MAY be displayed, but they SHALL be visibly marked as potentially out of date, and the app SHALL refresh them once reconnected.

#### Scenario: Cached data is marked stale

- **WHEN** the user opens customer or ledger data while offline
- **THEN** the app states that the data may be out of date
- **AND** the data refreshes after connectivity returns
