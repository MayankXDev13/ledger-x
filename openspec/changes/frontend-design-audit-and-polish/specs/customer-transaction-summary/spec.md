# Spec Delta

## ADDED Requirements

### Requirement: Customer collection and aging summaries in list surfaces
Customer listing views across both web and mobile clients SHALL surface current receivable totals and aging information alongside contact identity, so the ledger remains immediately informative without requiring per-customer drilldown.

#### Scenario: Customer list shows balance and age
- **WHEN** the customer list renders for a customer who has an outstanding credit balance
- **THEN** the total unpaid amount and days unpaid are visible on their list entry
