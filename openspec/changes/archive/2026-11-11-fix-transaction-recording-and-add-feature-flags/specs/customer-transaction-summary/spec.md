# Spec Delta

## ADDED Requirements

### Requirement: A newly recorded entry appears in the customer view without a manual refresh

After a transaction is recorded for a customer, the customer detail view SHALL show that entry in its transaction list and SHALL include it in the totals it displays, on both the web and the mobile client, without the user pulling to refresh or navigating away and back.

#### Scenario: The entry is listed at once
- **WHEN** a user records a transaction for a customer and returns to that customer's page
- **THEN** the transaction list includes the new entry
- **AND** it appears in the position the list orders it in, newest first

#### Scenario: The totals include the entry
- **WHEN** a user records a credit of 500 for a customer whose total credit was 1,000
- **THEN** the total credit shown on that customer's page is 1,500
- **AND** the net balance reflects the same entry

#### Scenario: The entry is not lost while it syncs
- **WHEN** the entry was queued offline and has not yet been accepted by the server
- **THEN** it is still listed and marked as pending
- **AND** it is not dropped from the list once the server accepts it
