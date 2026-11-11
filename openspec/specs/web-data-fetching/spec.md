# web-data-fetching Specification

## Purpose
Defines how the Next.js web app fetches, caches, and mutates server state with TanStack Query so every screen shares one predictable data contract.

## Requirements

### Requirement: Single QueryClient with documented defaults

The web app SHALL provide one `QueryClient` with explicit `staleTime`, `gcTime`, `retry`, and `refetchOnWindowFocus` defaults shared by all hooks.

#### Scenario: Defaults are centralized
- **WHEN** any screen mounts a query hook
- **THEN** it inherits the shared client defaults unless the hook declares a justified override

#### Scenario: No ad-hoc fetch in components
- **WHEN** a component needs server data
- **THEN** it calls a typed hook instead of inline `fetch`

### Requirement: Hierarchical query keys

Each domain SHALL expose a key factory (`all`, `lists`, `detail(id)`, scoped filters) and every query SHALL use its factory key.

#### Scenario: Keys invalidate by domain
- **WHEN** a customer mutation succeeds
- **THEN** invalidating the domain `all` key refreshes list and detail queries

#### Scenario: Keys are stable
- **WHEN** the same filters are applied twice
- **THEN** both renders produce identical keys and share cache

### Requirement: Mutations invalidate and surface envelope errors

Every mutation SHALL invalidate its domain keys on success, SHALL await the refetch of the queries it invalidated before the mutation settles, and SHALL surface the API `error` string plus field `details` via toast or inline error. The field detail SHALL be shown alongside the error message rather than being discarded.

#### Scenario: Create refreshes list

- **WHEN** a create-customer mutation succeeds
- **THEN** the customer list refetches without a manual reload

#### Scenario: Server message reaches user

- **WHEN** the API returns `400` with envelope `error` and `details`
- **THEN** the UI shows that message, never `[object Object]` or a silent failure

#### Scenario: The field detail is shown too

- **WHEN** the API returns `400` with envelope `error` "Validation failed" and a detail for the `amount` field
- **THEN** the UI shows the error message together with the detail for that field
- **AND** it does not show the error message on its own

#### Scenario: The mutation settles after the refresh

- **WHEN** a mutation invalidates the queries that display its result
- **THEN** the mutation does not settle until the invalidated queries have refetched

### Requirement: A recorded transaction refreshes every affected view

After a transaction is created, updated or deleted, the web client SHALL invalidate and await the refetch of every query that displays it: the dashboard metrics, recent transactions and analytics, the affected customer's transaction list, the customer list and customer detail, the collection view, and the customer's statement. The new entry SHALL therefore be visible on the dashboard and on the customer page without waiting for a polling interval and without a manual reload.

#### Scenario: The dashboard shows the new entry at once

- **WHEN** a user records a transaction and then opens the dashboard
- **THEN** the dashboard metrics, recent transactions and analytics include that transaction
- **AND** the dashboard does not wait for its polling interval to show it

#### Scenario: The customer page shows the new entry at once

- **WHEN** a user records a transaction from a customer's page
- **THEN** that customer's transaction list and its totals include the new entry without a manual reload

#### Scenario: Deleting an entry refreshes the same views

- **WHEN** a user deletes a transaction
- **THEN** the dashboard, the customer page, the collection view and the statement no longer show it

### Requirement: Polling is a fallback for writes made elsewhere

The dashboard SHALL keep a bounded polling interval so that a transaction recorded on another device or in another tab appears without a manual reload, and that interval SHALL be shorter than the delay a shopkeeper would notice. The polling interval SHALL NOT be the mechanism by which a write made in the same client becomes visible.

#### Scenario: The polling interval is bounded

- **WHEN** the dashboard queries are configured
- **THEN** each declares an explicit polling interval

#### Scenario: A write made elsewhere is picked up

- **WHEN** a transaction is recorded on another device
- **THEN** the dashboard shows it within the polling interval without a manual reload

#### Scenario: Same-client writes do not wait for the poll

- **WHEN** a transaction is recorded in the same client
- **THEN** it is visible through the mutation's own invalidation
- **AND** the polling interval is not what makes it visible
