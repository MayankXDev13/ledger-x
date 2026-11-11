# dashboard-analytics Specification (Delta)

## ADDED Requirements

### Requirement: Unrestricted receivables and aging availability

Customer balances, outstanding amounts, and aging bucket breakdowns SHALL be available across client dashboards and customer lists without being blocked or 404'd by administrative feature flags such as `collection`.

#### Scenario: Analytics when collection flag is off
- **WHEN** the `collection` feature flag is disabled
- **THEN** the dashboard analytics and customer list still receive customer balances, aging days, and top debtors
- **AND** outstanding figures do not collapse to zero
