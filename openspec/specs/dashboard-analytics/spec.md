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

### Requirement: Dashboard charts display accurate per-entry and per-month labels

The web dashboard's **Transaction Flow**, **By Type**, and **12-Month Trend** charts SHALL render accurate, non-static tooltip headers and disambiguated X-axis labels rather than repeating a single static series label or colliding identical same-day dates.

#### Scenario: By Type tooltip displays the entry label instead of a static header
- **WHEN** a user hovers or focuses any bar in the **By Type** chart
- **THEN** the tooltip header identifies that transaction's date/time or customer rather than displaying the static string `"Transactions"`

#### Scenario: Multiple transactions on the same day remain distinguishable
- **WHEN** two or more of the last five transactions occurred on the same calendar day
- **THEN** their X-axis labels and tooltips distinguish each entry rather than collapsing them onto an identical date label

#### Scenario: 12-Month Trend tooltip displays the formatted month name
- **WHEN** a user hovers or focuses a bar in the **12-Month Trend** chart
- **THEN** the tooltip header displays the formatted month (for example, `"Nov 26"`) rather than `"12-Month Activity"`

### Requirement: Dashboard flow charts preserve direction and type classification

The web dashboard's **Transaction Flow** and **By Type** charts SHALL classify debit entries as payments received regardless of whether an optional payment method was recorded, and SHALL preserve negative signs on signed axis ticks and tooltips.

#### Scenario: Debit without a payment method is styled as payment received
- **WHEN** a debit transaction is recorded with no payment method (`None`)
- **THEN** the **By Type** chart renders it with the payment-received visual style and label rather than the credit-given style

#### Scenario: Negative payment ticks retain their minus sign
- **WHEN** the **Transaction Flow** or **By Type** chart renders negative values below zero on the Y-axis
- **THEN** the Y-axis tick labels display the negative sign (for example, `−₹500`) instead of an unsigned magnitude
