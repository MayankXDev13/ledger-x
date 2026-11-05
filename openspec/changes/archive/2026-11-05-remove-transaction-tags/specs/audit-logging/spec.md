# Spec Delta

## MODIFIED Requirements

### Requirement: Data mutations are audited

The system SHALL record create, update, and delete operations on customers and transactions with actor, entity type, entity id, action, timestamp, and before/after summary where applicable. Reads SHALL NOT create audit entries.

#### Scenario: Customer update is traceable

- **WHEN** a user renames a customer
- **THEN** an audit entry links that user, customer id, and the change timestamp

#### Scenario: Reads create no entries

- **WHEN** a user lists transactions or views the dashboard
- **THEN** no audit entry is created
