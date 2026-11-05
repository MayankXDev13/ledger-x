# Spec Delta

## MODIFIED Requirements

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
