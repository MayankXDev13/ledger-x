# Spec Delta

## Purpose

Turns a brand-new account into a working ledger quickly by guiding the first customer and first entry, offering sample data, and explaining every empty screen.

## ADDED Requirements

### Requirement: First-run guidance

A newly registered user SHALL be guided through adding a first customer and recording a first entry. The flow SHALL be skippable, and completion or dismissal SHALL persist per user so the guidance is not shown again on later launches.

#### Scenario: New user sees the guided flow

- **WHEN** a user signs in for the first time
- **THEN** they are offered a guided path to add a customer and record an entry

#### Scenario: Skipping persists

- **WHEN** a user skips onboarding
- **THEN** they reach the dashboard
- **AND** the onboarding prompt is not shown again on the next launch

#### Scenario: Completion is remembered

- **WHEN** a user completes onboarding
- **THEN** the completion state is stored for that user
- **AND** the guided flow does not reappear

### Requirement: Optional sample data

The onboarding flow SHALL offer clearly labeled sample customers and transactions so a user can explore the app before entering real data. Removing sample data SHALL delete exactly those sample records and leave real records and totals unchanged.

#### Scenario: Sample data is labeled

- **WHEN** a user loads sample data
- **THEN** the sample customers and entries are visibly marked as examples

#### Scenario: Removing sample data restores real totals

- **WHEN** a user removes sample data after adding real entries
- **THEN** only the sample records are deleted
- **AND** the user's real customers, transactions, and totals are unchanged

### Requirement: Actionable empty states

Each primary screen — customers, ledger, dashboard, and collection — SHALL show an empty state that explains the screen's purpose and offers its primary action instead of a blank view.

#### Scenario: Empty customers screen offers the next step

- **WHEN** a user with no customers opens the customers screen
- **THEN** an empty state explains that no customers exist yet
- **AND** it offers a direct action to add one

#### Scenario: Empty dashboard explains the first entry

- **WHEN** a user with no transactions opens the dashboard
- **THEN** the empty state explains that metrics appear after the first entry
- **AND** it offers an action to record one

#### Scenario: Empty collection view explains receivables

- **WHEN** a user with no outstanding balances opens the collection view
- **THEN** an empty state explains that nobody owes money right now
