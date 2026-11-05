# Spec Delta

## Purpose

Provides an append-only audit trail for authentication events and financial-data changes for accountability.

## ADDED Requirements

### Requirement: Auth events are audited

The system SHALL record signup, login, logout, password-reset request, password change, and session revocation with actor, timestamp, IP/user-agent when available, and outcome.

#### Scenario: Failed login is logged

- **WHEN** a login attempt fails for an existing email
- **THEN** an audit entry records the attempt, timestamp, and failure outcome without storing the password

#### Scenario: Password reset is logged

- **WHEN** a user completes password reset
- **THEN** an audit entry records the reset completion and session invalidation

### Requirement: Data mutations are audited

The system SHALL record create, update, and delete operations on customers, transactions, tags, and tag associations with actor, entity type, entity id, action, timestamp, and before/after summary where applicable. Reads SHALL NOT create audit entries.

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
