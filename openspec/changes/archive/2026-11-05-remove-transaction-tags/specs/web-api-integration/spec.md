# Spec Delta

## REMOVED Requirements

### Requirement: Canonical tag endpoints
**Reason**: Transaction tags feature is fully removed; no tag CRUD or association endpoints remain.
**Migration**: Callers of `/transaction-tags`, `/transaction-tags/:id`, `/transactions/:id/tags`, and `/transactions/:id/tags/:tagId` receive `404` with the JSON error envelope. Use customer and transaction endpoints only.

## MODIFIED Requirements

### Requirement: Ownership enforcement across related resources

Every customer and transaction operation SHALL be scoped to the authenticated user. A transaction SHALL only reference a customer owned by the caller.

#### Scenario: Cross-user customer reference is rejected
- **WHEN** an authenticated client creates a transaction with a `customerId` owned by another user
- **THEN** the API responds `404` with the JSON error envelope
- **AND** no transaction is created

#### Scenario: Cross-user transaction tags are hidden
- **WHEN** an authenticated client requests any removed `/transactions/:id/tags` path, including for a transaction owned by another user
- **THEN** the API responds `404` with the JSON error envelope (feature removed)
- **AND** no tag data or association is exposed or changed

#### Scenario: Cross-user tag reference is rejected
- **WHEN** an authenticated client attempts any removed tag-attach operation, including with a tag owned by another user
- **THEN** the API responds `404` with the JSON error envelope (feature removed)
- **AND** no association is created

#### Scenario: Cross-user mutation is rejected
- **WHEN** an authenticated client updates or deletes a customer or transaction owned by another user
- **THEN** the API responds `404` with the JSON error envelope
- **AND** the resource is unchanged

#### Scenario: Removed tag paths return 404
- **WHEN** an authenticated client requests any removed `/transaction-tags*` or `/transactions/:id/tags*` path
- **THEN** the API responds `404` with the JSON error envelope

### Requirement: Contract tests run from the repository root

The repository SHALL provide automated API contract tests that run without a live Supabase project, Postgres instance, or network access, covering route resolution, authentication, trusted-origin behavior, the error envelope, query validation, and connection cleanup. The root `bun run test` command SHALL execute them.

#### Scenario: Contract suite passes without external services
- **WHEN** a developer runs `bun run test` from the repository root
- **THEN** the API contract tests run and pass without external services

#### Scenario: Regressions are caught
- **WHEN** an unauthenticated request reaches a handler, or a database client is left open
- **THEN** the contract suite fails
