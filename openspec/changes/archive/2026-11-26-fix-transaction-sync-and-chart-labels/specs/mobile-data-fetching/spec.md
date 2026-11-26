# Spec Delta

## ADDED Requirements

### Requirement: Transaction writes update cached mobile views immediately

When a user creates, updates, or deletes a transaction in the mobile app, the client SHALL patch cached customer transaction lists, customer balances, and dashboard summaries immediately and fold un-synced queued entries into customer detail and customer list balances so screens reflect the new balance without waiting for a full refetch.

#### Scenario: Recording a transaction from customer details updates balance and list immediately
- **WHEN** a user records a credit or payment from a customer's detail screen and returns to that screen
- **THEN** both the customer's transaction list and balance card reflect the new transaction immediately, even while offline or before the background refetch completes

#### Scenario: Customer list balances reflect queued entries
- **WHEN** a user records a transaction while offline or before sync completes and opens the Customers tab
- **THEN** that customer's displayed balance includes the queued transaction amount

### Requirement: Concurrent offline queue sync requests coalesce instead of dropping

When a queue replay is requested while another replay is already in flight, the mobile offline queue SHALL schedule a follow-up replay pass once the current pass finishes rather than dropping the request, ensuring newly enqueued transactions are synced and affected queries are invalidated.

#### Scenario: Transaction enqueued during an active background sync still replays and invalidates
- **WHEN** a user submits a transaction while a foreground or reconnect sync is already running
- **THEN** the queue runs a follow-up replay pass that sends the new transaction to the server and invalidates affected query caches
