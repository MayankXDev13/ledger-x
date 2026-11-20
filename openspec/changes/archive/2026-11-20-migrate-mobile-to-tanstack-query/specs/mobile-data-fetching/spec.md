# Spec Delta

## Purpose

Defines how the Expo mobile app fetches, caches, refreshes, and mutates server state with TanStack Query alongside the SQLite offline write queue and React Native app lifecycle.

## ADDED Requirements

### Requirement: Single QueryClient wired to React Native lifecycle

The mobile app SHALL provide one `QueryClient` with explicit `staleTime`, `gcTime`, and `retry` defaults shared by all hooks, and SHALL connect TanStack Query's `focusManager` to React Native `AppState` and `onlineManager` to `expo-network`.

#### Scenario: Defaults are centralized
- **WHEN** any mobile screen mounts a query hook
- **THEN** it inherits the shared client defaults unless the hook declares a justified override

#### Scenario: Foreground and connectivity drive refresh
- **WHEN** the mobile app returns to the foreground or regains network connectivity
- **THEN** TanStack Query treats the app as focused and online so stale active queries refetch automatically

#### Scenario: No ad-hoc API reads in screens
- **WHEN** a mobile screen or component needs server data
- **THEN** it calls a typed query or mutation hook instead of calling `@/lib/api` directly inside `useEffect` or `useFocusEffect`

### Requirement: Hierarchical query keys with cache sharing across screens

Each mobile domain (`dashboard`, `customers`, `transactions`, `collection`, `statements`, `settings`, `feature-flags`) SHALL expose a key factory (`all`, `lists`, `detail(id)`, scoped filters) matching the web app's domain boundaries so screens share cached responses and deduplicate concurrent requests.

#### Scenario: Shared cache across tabs and modals
- **WHEN** two mounted screens or modals read the customer list
- **THEN** both share the same query key and cached response without duplicate network requests while fresh

#### Scenario: Keys invalidate by domain
- **WHEN** a customer or transaction mutation succeeds
- **THEN** invalidating the affected domain keys refreshes all mounted and stale views without requiring a manual pull-to-refresh

### Requirement: Offline write queue coordinates with query cache

Offline-capable writes (customer creation and transaction creation) SHALL continue to enqueue through the SQLite offline write queue, and when queued writes replay successfully the queue controller SHALL invalidate all affected query keys (`dashboard`, `customers`, `transactions`, `collection`, `statements`) so server-confirmed data replaces pending overlays without a manual refresh.

#### Scenario: Offline reads remain visible and labeled
- **WHEN** the device goes offline after loading customer or ledger data
- **THEN** previously cached query data remains visible in the UI
- **AND** the screen continues to indicate that data may be out of date until connectivity returns

#### Scenario: Synced offline writes refresh views
- **WHEN** the offline write queue replays one or more accepted items on reconnect
- **THEN** affected domain queries are invalidated and refetched automatically
- **AND** pending items are reconciled with server records without duplicates

### Requirement: Direct mutations invalidate and surface API errors

Online-only mutations (such as updating or deleting a customer, updating or deleting a transaction, updating settings, seeding/removing sample data, or deleting an account) SHALL run through TanStack Query mutations that invalidate affected domain keys on success and surface the normalized API error message to the user on failure.

#### Scenario: Transaction update refreshes totals and lists
- **WHEN** a user edits or deletes a transaction on the customer detail screen
- **THEN** the customer's transaction list, customer balances, dashboard metrics, analytics, collection list, and statement queries are invalidated

#### Scenario: Server error reaches the user
- **WHEN** a mutation fails with an API validation or server error
- **THEN** the screen displays the normalized error message rather than failing silently

### Requirement: Query cache clears on sign-out

Signing out of the mobile app SHALL clear all cached queries from the `QueryClient` so a subsequent user session on the same device never sees stale data from a prior account.

#### Scenario: Account switch sees no prior cache
- **WHEN** a user signs out and another account signs in during the same app process
- **THEN** no cached queries from the previous account are returned
