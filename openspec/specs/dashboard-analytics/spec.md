# dashboard-analytics Specification

## Purpose

Answers who owes the user money and how receivables are trending over time through a monthly trend, a top-debtors list, and aging buckets.

## Requirements

### Requirement: Twelve-month credit and debit trend

The dashboard SHALL present credit and debit totals for each of the last twelve calendar months, including months with no activity (reported as zero). Values SHALL be computed from the user's non-deleted transactions only.

#### Scenario: Twelve monthly points are returned

- **WHEN** a user opens the dashboard trend
- **THEN** twelve monthly data points are available in chronological order
- **AND** each point carries a credit total and a debit total

#### Scenario: Empty months are zero

- **WHEN** a month has no transactions
- **THEN** that month appears with zero credit and zero debit

#### Scenario: Deleted entries are excluded

- **WHEN** transactions are soft-deleted
- **THEN** they do not contribute to any trend value

### Requirement: Top debtors

The dashboard SHALL list the customers with the largest positive outstanding balances, highest first, with the default list size configurable and at least five customers shown when that many have positive balances.

#### Scenario: Debtors are ordered by amount

- **WHEN** the top-debtors list loads
- **THEN** customers appear in descending order of outstanding balance
- **AND** customers with zero or negative balances are excluded

#### Scenario: Isolation from other users

- **WHEN** a user views top debtors
- **THEN** only customers owned by that user are included
- **AND** no other user's balances appear

### Requirement: Receivables aging buckets

The dashboard SHALL split total receivables into aging buckets of 0–30, 31–60, and 60+ days. Bucket assignment SHALL apply payments first-in-first-out against the oldest unpaid credits, and a credit that has been fully paid SHALL NOT contribute to any bucket.

#### Scenario: A 45-day-old credit lands in 31–60

- **WHEN** the only unpaid credit is 45 days old
- **THEN** its amount appears in the 31–60 day bucket
- **AND** the other buckets are zero

#### Scenario: Paid credits are excluded from aging

- **WHEN** an old credit has been fully offset by later payments
- **THEN** it contributes nothing to any aging bucket

#### Scenario: Buckets sum to total receivables

- **WHEN** the aging view loads
- **THEN** the three bucket totals add up to the user's total positive receivables
