# web-api-integration Specification

## Purpose

Defines the HTTP contract and browser-facing runtime behavior that lets the Next.js web app call the Ledger-X API safely, consistently, and without leaking database connections.

## Requirements

### Requirement: Canonical tag endpoints

Tag CRUD SHALL be served at `/transaction-tags` and `/transaction-tags/:id`, and transaction-tag associations SHALL be served at `/transactions/:id/tags` and `/transactions/:id/tags/:tagId`. Tag routes SHALL NOT be shadowed by the `/transactions/:id` route. Creating a tag whose name already exists for the user SHALL return `409`.

#### Scenario: List tags reaches the tag collection
- **WHEN** an authenticated client sends `GET /transaction-tags`
- **THEN** the API returns the requesting user's tags
- **AND** the request is not interpreted as `GET /transactions/:id`

#### Scenario: Tag lifecycle uses top-level paths
- **WHEN** an authenticated client creates, updates, or deletes a tag through `/transaction-tags`
- **THEN** the operation applies to that user's tag and returns the corresponding success or error response

#### Scenario: Duplicate tag name is rejected
- **WHEN** an authenticated client creates or renames a tag to a name that already exists for that user
- **THEN** the API responds `409` with the JSON error envelope
- **AND** the existing tag is unchanged

#### Scenario: Transaction tag associations stay under transactions
- **WHEN** an authenticated client adds or removes a tag for a transaction through `/transactions/:id/tags`
- **THEN** the association changes for that transaction without affecting other users' data

### Requirement: Bearer authentication on protected routes

Every non-public API route SHALL require a valid Better Auth session token in the `Authorization: Bearer <token>` header. Missing or invalid tokens SHALL return `401` with the JSON error envelope, and authentication SHALL complete before a protected handler runs.

#### Scenario: Missing token is rejected
- **WHEN** a client calls a protected route without an `Authorization` header
- **THEN** the API responds `401` with a JSON error
- **AND** the route handler does not run

#### Scenario: Invalid token is rejected
- **WHEN** a client calls a protected route with a token that Better Auth rejects
- **THEN** the API responds `401` with a JSON error

#### Scenario: Authenticated identity is available to handlers
- **WHEN** a client calls `/auth/me` with a valid token
- **THEN** the API responds `200` with the authenticated user's `id` and `email`

#### Scenario: Supabase token is rejected after cutover
- **WHEN** a client calls a protected route with a pre-migration Supabase access token
- **THEN** the API responds `401` with a JSON error

### Requirement: Ownership enforcement across related resources

Every customer, transaction, tag, and tag-association operation SHALL be scoped to the authenticated user. A transaction SHALL only reference a customer owned by the caller, and a tag association SHALL only reference a transaction and a tag owned by the caller.

#### Scenario: Cross-user customer reference is rejected
- **WHEN** an authenticated client creates a transaction with a `customerId` owned by another user
- **THEN** the API responds `404` with the JSON error envelope
- **AND** no transaction is created

#### Scenario: Cross-user transaction tags are hidden
- **WHEN** an authenticated client requests or changes tags for a transaction owned by another user
- **THEN** the API responds `404` with the JSON error envelope
- **AND** no tag data or association is exposed or changed

#### Scenario: Cross-user tag reference is rejected
- **WHEN** an authenticated client attaches a tag owned by another user to one of their own transactions
- **THEN** the API responds `404` with the JSON error envelope
- **AND** no association is created

#### Scenario: Cross-user mutation is rejected
- **WHEN** an authenticated client updates or deletes a customer, transaction, or tag owned by another user
- **THEN** the API responds `404` with the JSON error envelope
- **AND** the resource is unchanged

### Requirement: Configurable trusted origins

The API SHALL read browser origins from the `TRUSTED_ORIGINS` environment variable as a comma-separated allowlist, defaulting to `http://localhost:3000`. Requests without an `Origin` header SHALL be allowed; browser requests from origins outside the allowlist SHALL NOT receive a matching `Access-Control-Allow-Origin` response.

#### Scenario: Configured origin is allowed
- **WHEN** `TRUSTED_ORIGINS` contains the requesting web origin
- **THEN** the API returns that origin in `Access-Control-Allow-Origin`
- **AND** the request may use `GET`, `POST`, `PUT`, `DELETE`, and `OPTIONS` methods with `Content-Type` and `Authorization` headers

#### Scenario: Unlisted origin is not allowed
- **WHEN** a browser request arrives from an origin not present in `TRUSTED_ORIGINS`
- **THEN** the API does not return a matching `Access-Control-Allow-Origin` header
- **AND** the browser cannot read the response

#### Scenario: Non-browser clients are unaffected
- **WHEN** a request has no `Origin` header, such as a native app or curl
- **THEN** the API processes the request normally

#### Scenario: Preflight does not require a token
- **WHEN** a browser sends an `OPTIONS` preflight request for a protected route from a trusted origin
- **THEN** the API returns a successful preflight response
- **AND** the request is not rejected with `401`

### Requirement: JSON error envelope

Every error response SHALL be JSON containing a top-level `error` string and an optional `details` object. Validation failures SHALL return `400`, missing or invalid credentials `401`, missing resources `404`, and unhandled failures `500` with a generic message that does not expose stack traces or database errors.

#### Scenario: Validation failure returns field details
- **WHEN** a request body fails validation
- **THEN** the API responds `400` with `error` and per-field `details`

#### Scenario: Unknown route returns JSON 404
- **WHEN** a client requests a path that does not exist
- **THEN** the API responds `404` with the JSON envelope instead of an HTML error page

#### Scenario: Unhandled failure is contained
- **WHEN** a handler throws an unexpected error
- **THEN** the API responds `500` with a generic JSON error
- **AND** the response contains no stack trace, SQL, or connection string

#### Scenario: Not-found resource is explicit
- **WHEN** an authenticated client requests a customer or transaction that does not exist or belongs to another user
- **THEN** the API responds `404` with the JSON envelope

### Requirement: Query parameter validation

Transaction listing SHALL validate `page`, `pageSize`, `start`, and `end` before querying. `page` SHALL be an integer of at least 1, `pageSize` an integer from 1 to 100, and `start` and `end` valid dates. Invalid values SHALL return `400` with field details instead of producing invalid database queries.

#### Scenario: Invalid page is rejected
- **WHEN** a client requests a transaction list with `page=abc` or `page=0`
- **THEN** the API responds `400` with a validation error for `page`

#### Scenario: Page size is bounded
- **WHEN** a client requests `pageSize=1000`
- **THEN** the API responds `400` with a validation error for `pageSize`

#### Scenario: Invalid date is rejected
- **WHEN** a client supplies a `start` or `end` value that is not a valid date
- **THEN** the API responds `400` with a validation error for that field

#### Scenario: Valid filters are applied
- **WHEN** a client supplies valid pagination and date filters
- **THEN** the API applies them to the query and returns the paginated result with the correct page metadata

### Requirement: Request-scoped database connections

Each API request that opens a Postgres connection SHALL close that connection when the request completes, including when a handler throws. Connections SHALL NOT be shared across requests or left open after a response.

#### Scenario: Connection closes after a successful request
- **WHEN** a request that queries the database completes successfully
- **THEN** its Postgres client is closed

#### Scenario: Connection closes after a failed request
- **WHEN** a request that opened a database connection fails
- **THEN** its Postgres client is still closed

### Requirement: Web client consumes the error envelope

The web API client SHALL read the server's `error` string and optional `details` when presenting failures to the user, and SHALL require `NEXT_PUBLIC_API_URL` for production builds instead of silently defaulting to localhost.

#### Scenario: Server error message is shown
- **WHEN** the API returns an error envelope
- **THEN** the web app surfaces the `error` string rather than a generic status message or `[object Object]`

#### Scenario: Validation details are surfaced
- **WHEN** the API returns field-level validation details
- **THEN** the web app can present those details to the user

#### Scenario: Missing production API URL fails fast
- **WHEN** the web app is built for production without `NEXT_PUBLIC_API_URL`
- **THEN** the build fails with a clear configuration error instead of targeting localhost

### Requirement: Contract tests run from the repository root

The repository SHALL provide automated API contract tests that run without a live Supabase project, Postgres instance, or network access, covering route resolution, authentication, trusted-origin behavior, the error envelope, query validation, and connection cleanup. The root `bun run test` command SHALL execute them.

#### Scenario: Contract suite passes without external services
- **WHEN** a developer runs `bun run test` from the repository root
- **THEN** the API contract tests run and pass without external services

#### Scenario: Regressions are caught
- **WHEN** a tag route is shadowed, an unauthenticated request reaches a handler, or a database client is left open
- **THEN** the contract suite fails
