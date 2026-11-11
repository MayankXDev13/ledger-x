# Spec Delta

## ADDED Requirements

### Requirement: The dashboard reflects a newly recorded transaction immediately

After a transaction is recorded, the dashboard SHALL reflect it in its metrics, its recent-transactions list and its analytics without waiting for a polling interval, on both the web and the mobile client.

#### Scenario: The metrics include the entry
- **WHEN** a user records a transaction and opens the dashboard
- **THEN** the outstanding total, the customer count and the net balance reflect that transaction

#### Scenario: The recent list includes the entry
- **WHEN** a user records a transaction
- **THEN** the dashboard's recent-transactions list includes it without a manual reload

#### Scenario: The trend and aging include the entry
- **WHEN** a user records a transaction in the current month
- **THEN** the twelve-month trend and the receivables aging buckets reflect it

#### Scenario: A write made on another device is picked up
- **WHEN** a transaction is recorded on another device
- **THEN** the dashboard reflects it within the polling interval without a manual reload
