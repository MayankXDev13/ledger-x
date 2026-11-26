# Spec Delta

## ADDED Requirements

### Requirement: Transaction mutations patch cached dashboard metrics and customer lists immediately

On transaction creation, update, or deletion, the web client SHALL update cached customer transaction lists, customer balances, recent transactions, dashboard metrics, and dashboard analytics immediately from the mutation response before background refetches settle, so switching between customer and dashboard pages never flashes stale totals.

#### Scenario: Creating a transaction on the customer page updates dashboard metrics cache immediately
- **WHEN** a user creates a transaction from a customer detail page and then navigates to the dashboard
- **THEN** the dashboard's total outstanding, monthly net, and recent transactions reflect the new entry immediately without waiting for the dashboard refetch to finish

#### Scenario: Creating a transaction updates the customer detail list and balance immediately
- **WHEN** a user creates a transaction from a customer detail page
- **THEN** the customer's transaction list, total credit/paid cards, and current balance include the new entry immediately upon mutation success

### Requirement: Authenticated ledger read responses prohibit HTTP caching

Authenticated ledger read responses returned by the API SHALL include `Cache-Control: no-store` so browsers and intermediate proxies never serve a stale `GET` response that overwrites freshly patched client state after a transaction write.

#### Scenario: Post-write refetch never hits a cached GET response
- **WHEN** the web client refetches customer transactions, balances, or dashboard metrics immediately after a transaction mutation
- **THEN** the API response carries `Cache-Control: no-store` and returns the latest committed database state
