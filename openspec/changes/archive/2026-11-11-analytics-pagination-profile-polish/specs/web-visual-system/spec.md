# web-visual-system Specification (Delta)

## ADDED Requirements

### Requirement: Settings page tabbed layout

The web Settings page SHALL structure account settings, data exports, and security controls into a tabbed layout using standard tab triggers:
- **Account**: User profile details, Google identity, and UPI collection setup.
- **Data & Export**: CSV and JSON data export downloads and sample data actions.
- **Security**: Account deletion actions and session management.

#### Scenario: Navigating settings tabs
- **WHEN** the user visits `/settings`
- **THEN** settings are presented inside an accessible Tab list
- **AND** switching tabs reveals the corresponding controls without page reloads

### Requirement: Customer detail infinite scroll transactions

The customer detail view on web SHALL paginate transactions using infinite scrolling rather than click-based numbered pages (1 to 10).

#### Scenario: Scrolling customer transactions
- **WHEN** the user scrolls to the bottom of the customer transaction list
- **THEN** the next batch of 10 transactions is fetched and appended to the table
- **AND** active search queries and type filters remain applied
