# customer-transaction-summary Specification

## Purpose

Server-computed, whole-customer credit/debit aggregates and page-aware running balances for the customer detail view, so summary stats and "Balance after" rows stay correct regardless of transaction-list pagination.

## Requirements

### Requirement: Whole-customer transaction aggregates in list response

The transaction-list endpoint (`GET /transactions/customers/:id/transactions`) SHALL return `totalCredit` and `totalDebit` sums computed over ALL of the customer's non-deleted transactions matching the active filters, without `LIMIT`/`OFFSET`.

#### Scenario: Totals span all pages

- **WHEN** a customer has 18 transactions with `pageSize=10` and the client requests page 1
- **THEN** the response `total` is 18 and `totalCredit`/`totalDebit` equal the sums over all 18 rows, not just the 10 on page 1

#### Scenario: Aggregates respect active filters

- **WHEN** the request includes `start`/`end` date filters
- **THEN** `total`, `totalCredit`, and `totalDebit` are all computed over the same date-filtered set

#### Scenario: No transactions

- **WHEN** a customer has zero matching transactions
- **THEN** `total`, `totalCredit`, and `totalDebit` are all 0 and `data` is an empty array

### Requirement: Customer detail summary uses whole-customer aggregates

The customer detail view SHALL render Total Credit, Total Debit, Net Balance, and the profile-header balance from the server-provided whole-customer aggregates, never from the current page slice.

#### Scenario: Navigating pages keeps totals stable

- **WHEN** the user moves from page 1 to page 2 of a customer's transactions
- **THEN** Total Credit, Total Debit, and Net Balance remain unchanged and equal the whole-customer values

#### Scenario: Transaction count matches aggregate set

- **WHEN** the transaction list loads
- **THEN** the displayed entry count equals the server `total`, consistent with the aggregates above

### Requirement: Page-aware running balances

Each transaction row's "Balance after" value SHALL equal the customer's true cumulative post-transaction balance, accounting for transactions on other pages.

#### Scenario: Older pages show correct running balance

- **WHEN** the user views page 2 (older transactions) of a customer with more transactions than one page holds
- **THEN** each row's "Balance after" reflects all transactions up to and including that row, not a balance recomputed from the visible page alone

### Requirement: Customer collection and aging summaries in list surfaces

Customer listing views across both web and mobile clients SHALL surface current receivable totals and aging information alongside contact identity, so the ledger remains immediately informative without requiring per-customer drilldown.

#### Scenario: Customer list shows balance and age

- **WHEN** the customer list renders for a customer who has an outstanding credit balance
- **THEN** the total unpaid amount and days unpaid are visible on their list entry

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
