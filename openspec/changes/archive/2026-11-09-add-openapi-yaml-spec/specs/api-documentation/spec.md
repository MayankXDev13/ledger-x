# Spec Delta

## Purpose

Defines a generated, committed OpenAPI 3.0 YAML description of the Ledger-X HTTP API so clients and tooling can rely on an accurate, drift-checked contract.

## ADDED Requirements

### Requirement: Complete route coverage

The committed OpenAPI document SHALL describe every route mounted by the API application, including auth, customers, transactions, books, dashboard, statements, collection, exports, account, settings, sample-data, and audit-log routes. The document SHALL NOT describe endpoints that the application no longer mounts.

#### Scenario: Every mounted route is documented

- **WHEN** the generator runs against the current API application
- **THEN** every mounted method/path pair appears exactly once in the document's `paths`
- **AND** each documented operation declares at least one response

#### Scenario: Removed endpoints are absent

- **WHEN** a route has been removed from the application, such as the former tag or password-auth endpoints
- **THEN** the generated document contains no path or operation for it

### Requirement: Valid OpenAPI 3.0 YAML

The committed document SHALL be valid YAML and SHALL conform to the OpenAPI 3.0 specification, declaring the version, API title, version, and description at the top level.

#### Scenario: Document parses as YAML

- **WHEN** the committed YAML file is parsed by a YAML parser
- **THEN** parsing succeeds and yields an object with an `openapi` field beginning with `3.0`

#### Scenario: Invalid document fails validation

- **WHEN** the committed document is missing required OpenAPI metadata or contains an invalid operation shape
- **THEN** the validation command exits non-zero with a message identifying the invalid location

### Requirement: Authentication declarations

The document SHALL declare a bearer-token security scheme and SHALL mark protected operations as requiring it. Public operations, including the Google OAuth redirect and Better Auth handler paths, SHALL NOT be marked as requiring bearer authentication.

#### Scenario: Protected operation declares bearer auth

- **WHEN** an operation corresponds to a route guarded by authentication middleware
- **THEN** that operation lists the bearer security scheme as a requirement

#### Scenario: Public operation omits bearer auth

- **WHEN** an operation corresponds to a public route such as `/api/auth/redirect/google`
- **THEN** that operation does not require the bearer security scheme

### Requirement: Request and response fidelity

Documented request bodies, parameters, and response schemas SHALL reflect the validators and serializers the application actually uses, including the JSON error envelope and the `400`, `401`, `404`, and `410` responses those handlers can return.

#### Scenario: Request body matches validation rules

- **WHEN** a handler validates its body with a Zod schema
- **THEN** the documented request body marks required fields, enumerations, and value constraints consistently with that schema

#### Scenario: Error responses are documented

- **WHEN** a handler can return a validation, authentication, not-found, or removed-feature error
- **THEN** the corresponding status code and JSON error envelope are documented for that operation

### Requirement: Generated from API source

The YAML document SHALL be produced by a generator that reads the API's route registrations and validator definitions, rather than by hand-editing the YAML. Regenerating from unchanged source SHALL produce byte-identical output.

#### Scenario: Regeneration is deterministic

- **WHEN** the generator runs twice against unchanged source
- **THEN** both runs produce identical content

#### Scenario: Source change is reflected

- **WHEN** a route or validator is added, changed, or removed and the generator runs
- **THEN** the resulting document reflects that change without any manual YAML editing

### Requirement: Drift detection

The project SHALL provide a non-mutating check that fails when the committed YAML differs from what the generator would produce, so continuous integration can reject stale documentation.

#### Scenario: Stale document fails the check

- **WHEN** the committed YAML does not match generated output
- **THEN** the check exits non-zero and reports that the spec must be regenerated

#### Scenario: Up-to-date document passes the check

- **WHEN** the committed YAML matches generated output
- **THEN** the check exits zero without modifying files
