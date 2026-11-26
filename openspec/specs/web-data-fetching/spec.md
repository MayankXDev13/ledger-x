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

### Requirement: Query cache clears on sign-out

Signing out of the web app SHALL clear all cached queries from the `QueryClient` so a subsequent sign-in within the same browser session never reads cached data belonging to a previous account.

#### Scenario: Sign-out clears cached server state

- **WHEN** an authenticated user triggers sign-out
- **THEN** the `QueryClient` cache is cleared before or alongside resetting local session state

### Requirement: TanStack Query lint rules are enforced

The web app ESLint configuration SHALL enable `@tanstack/eslint-plugin-query` recommended rules so unstable query keys, missing key dependencies, and invalid hook usage are caught during `lint`.

#### Scenario: Query lint plugin runs in CI and local lint

- **WHEN** `bun run lint` runs in `apps/web`
- **THEN** `@tanstack/eslint-plugin-query` rules execute against all web hooks and components with zero errors

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
