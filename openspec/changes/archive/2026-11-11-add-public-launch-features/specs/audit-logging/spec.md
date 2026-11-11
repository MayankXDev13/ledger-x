# Spec Delta

## ADDED Requirements

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
