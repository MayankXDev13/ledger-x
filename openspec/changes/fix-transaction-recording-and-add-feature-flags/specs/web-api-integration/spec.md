# Spec Delta

## MODIFIED Requirements

### Requirement: Web client consumes the error envelope

The web API client SHALL read the server's `error` string and optional `details` when presenting failures to the user, and SHALL require `NEXT_PUBLIC_API_URL` for production builds instead of silently defaulting to localhost. All server-state reads and writes in `apps/web` SHALL go through TanStack Query hooks using hierarchical key factories and the shared `QueryClient` defaults, and every mutation SHALL invalidate its domain keys so lists refresh without manual reload. A mutation that changes data other domains display SHALL invalidate those domains as well.

#### Scenario: Server error message is shown
- **WHEN** the API returns an error envelope
- **THEN** the web app surfaces the `error` string rather than a generic status message or `[object Object]`

#### Scenario: Validation details are surfaced
- **WHEN** the API returns field-level validation details
- **THEN** the web app can present those details to the user

#### Scenario: Missing production API URL fails fast
- **WHEN** the web app is built for production without `NEXT_PUBLIC_API_URL`
- **THEN** the build fails with a clear configuration error instead of targeting localhost

#### Scenario: Mutation refreshes domain cache
- **WHEN** a TanStack Query mutation for customers, transactions, or settings succeeds
- **THEN** its domain keys are invalidated and dependent lists refetch

#### Scenario: A transaction write refreshes every domain it changes
- **WHEN** a transaction mutation succeeds
- **THEN** the customer, dashboard, collection and statement domains are invalidated as well as the transaction domain
- **AND** the balances and totals those domains display reflect the new entry

#### Scenario: A rejected write keeps its field detail
- **WHEN** the API rejects a transaction write with an error envelope carrying field-level details
- **THEN** the web client holds those details and presents them alongside the error message
