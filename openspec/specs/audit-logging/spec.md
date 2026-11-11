# audit-logging Specification

## Purpose

Provides an append-only audit trail for authentication events and financial-data changes for accountability.

## Requirements

### Requirement: OAuth auth events are audited

The system SHALL record Google OAuth first-link/signup, login, logout, and session revocation with actor, timestamp, IP/user-agent when available, and outcome. Password-reset and password-change entries SHALL NOT be emitted.

#### Scenario: Google sign-in is logged

- **WHEN** a user completes Google sign-in (including first-time account linking)
- **THEN** an audit entry records the login with actor, timestamp, and outcome

#### Scenario: Logout revocation is logged

- **WHEN** a user logs out
- **THEN** an audit entry records the logout and session revocation

### Requirement: Data mutations are audited

The system SHALL record create, update, and delete operations on customers and transactions with actor, entity type, entity id, action, timestamp, and before/after summary where applicable. Reads SHALL NOT create audit entries.

#### Scenario: Customer update is traceable

- **WHEN** a user renames a customer
- **THEN** an audit entry links that user, customer id, and the change timestamp

#### Scenario: Reads create no entries

- **WHEN** a user lists transactions or views the dashboard
- **THEN** no audit entry is created

### Requirement: Audit log integrity and retention

Audit entries SHALL be append-only in Neon via Drizzle, queryable by user and time range for authorized callers, and SHALL be retained for a minimum configurable period with no silent deletion.

#### Scenario: Audit history survives edits

- **WHEN** a customer is updated then deleted
- **THEN** both audit entries remain queryable in chronological order

#### Scenario: Unauthorized audit access denied

- **WHEN** a user requests another user's audit entries
- **THEN** the API returns `404` or `401` with the JSON error envelope and exposes no entries

### Requirement: Account lifecycle events are audited

The system SHALL record account data export and account deletion with actor, timestamp, and outcome. The deletion entry SHALL remain queryable after the account is removed, without exposing personal data beyond the pseudonymous actor id. Failed deletion attempts SHALL be recorded with their outcome and SHALL NOT delete data.

#### Scenario: Data export is logged

- **WHEN** a user downloads their account data or a CSV export
- **THEN** an audit entry records the export with actor and timestamp

#### Scenario: Account deletion is logged and retained

- **WHEN** a user's account is deleted
- **THEN** an audit entry records the deletion with actor, timestamp, and outcome
- **AND** that entry remains queryable after the account record is gone

#### Scenario: Failed deletion is recorded without effect

- **WHEN** an account deletion attempt fails
- **THEN** an audit entry records the failed attempt and its outcome
- **AND** the account and its data remain intact
