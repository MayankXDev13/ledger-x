# Spec Delta

## Purpose

Defines how the Next.js web app fetches, caches, and mutates server state with TanStack Query so every screen shares one predictable data contract.

## ADDED Requirements

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

Every mutation SHALL invalidate its domain keys on success and SHALL surface the API `error` string plus field `details` via toast or inline error.

#### Scenario: Create refreshes list
- **WHEN** a create-customer mutation succeeds
- **THEN** the customer list refetches without a manual reload

#### Scenario: Server message reaches user
- **WHEN** the API returns `400` with envelope `error` and `details`
- **THEN** the UI shows that message, never `[object Object]` or a silent failure
