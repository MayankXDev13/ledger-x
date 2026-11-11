# mobile-shop-ui Specification (Delta)

## ADDED Requirements

### Requirement: Home user greeting and hero analytics

The Home screen SHALL display a personalized greeting incorporating the user's authentic profile name ("Namaste, [Name]") rather than raw email handles. The hero section SHALL prominently show Total Outstanding receivables, a proportional aging strip with breakdown (0–30d, 31–60d, 60+d), and top debtors.

#### Scenario: User name greeting
- **WHEN** the session contains the user's Google name
- **THEN** the Home screen greets the user with their name or first name ("Namaste, [Name]")
- **AND** falls back gracefully if only email is present

#### Scenario: Hero receivables presentation
- **WHEN** the user has outstanding customer receivables
- **THEN** the hero card displays the aggregate total outstanding amount in rupees
- **AND** the aging strip visualizes the proportion of dues in 0–30, 31–60, and 60+ day buckets

### Requirement: Customer detail infinite scroll pagination and filtering

The customer details screen SHALL fetch transactions page-by-page (initial batch size: 10) and support infinite scrolling as the user scrolls through the history. It SHALL also provide type filter controls (`All`, `Credit`, `Debit`).

#### Scenario: Initial batch loading
- **WHEN** the customer detail screen loads
- **THEN** the initial request fetches 10 transactions
- **AND** whole-customer totals (credit, debit, balance) reflect the entire customer ledger

#### Scenario: Infinite scroll on scroll
- **WHEN** the user scrolls near the end of the loaded transactions list
- **THEN** the next batch of 10 transactions is requested and appended seamlessly

#### Scenario: Transaction type filtering
- **WHEN** the user selects a filter chip (`Credit` or `Debit`)
- **THEN** only matching transactions are displayed in the list

### Requirement: Customer detail persistent bottom navigation

The customer details screen SHALL render a fixed bottom navigation bar mirroring the app's main tabs (`Home`, `Ledger`, `Customers`, `Profile`), allowing users to jump directly between major sections without needing to pop the navigation stack repeatedly.

#### Scenario: Navigating from customer details
- **WHEN** the user is viewing customer details
- **THEN** a bottom tab bar is visible at the bottom of the screen with `Customers` indicated as active
- **AND** tapping `Home`, `Ledger`, or `Profile` immediately navigates to that tab

### Requirement: Edit transaction modal status bar safe area

The edit transaction modal header SHALL apply top safe-area insets (`Math.max(insets.top, 16)`) so that the Close button ("X"), title, and "Save" button do not collide with the device battery indicator, notch, or status bar icons.

#### Scenario: Opening edit transaction on notched or punch-hole device
- **WHEN** the user opens the Edit Transaction modal
- **THEN** the modal header is positioned below the status bar and battery indicators with comfortable touch clearance

### Requirement: Profile screen avatar and segmented layout

The Profile screen SHALL display the user's profile image (or styled initials fallback), full display name, and email. It SHALL organize configuration into segmented sections:
- **Data**: CSV exports (Customers, Transactions) and full account JSON archive.
- **Security**: App PIN lock configuration.
- **Invitation**: Share card for inviting shopkeepers.
- **Session & Logout**: Device session indicator and a full-width destructive Logout button at the bottom.

#### Scenario: Profile avatar and header
- **WHEN** the user views the Profile tab
- **THEN** a circular avatar with their profile photo or initials is displayed beside their name and email

#### Scenario: Tabbed/Segmented controls
- **WHEN** the user toggles between `Data` and `Security`
- **THEN** the corresponding settings and export tools are displayed
