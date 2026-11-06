# user-auth Specification

## Purpose

Replaces Supabase Auth with Better Auth for email/password identity while preserving per-user data isolation.

## Requirements

### Requirement: Google-only OAuth sign-in

The system SHALL offer Google as the sole sign-in method through Better Auth and SHALL NOT accept passwords. Password endpoints (`/auth/signup`, `/auth/login`, `/auth/request-reset`, `/auth/reset-password`, `/auth/change-password`) SHALL be disabled and stored credential hashes SHALL be purged. A successful Google sign-in SHALL issue a session token usable as `Authorization: Bearer <token>`.

#### Scenario: New user signs in with Google and calls API

- **WHEN** a user completes Google sign-in and then calls `GET /auth/me` with the session token
- **THEN** the API returns `200` with that user's `id` and `email`

#### Scenario: Password endpoints are disabled

- **WHEN** a client calls any removed password endpoint
- **THEN** the API responds with an error status and the JSON error envelope and issues no session

### Requirement: Same-id account linking for existing password users

The first Google sign-in whose verified email matches an existing user SHALL link to that same `user.id`, preserving that user's customers, transactions, and history. The system SHALL NOT create a duplicate user for a known email.

#### Scenario: Existing user links via Google and keeps data

- **WHEN** the one existing password user signs in with Google using the same email
- **THEN** the session resolves to the same `user.id` that owns their imported customers and transactions

### Requirement: Session validation and revocation

The API SHALL validate the Better Auth session on every protected request and SHALL revoke sessions on logout, rejecting revoked or expired tokens with `401`.

#### Scenario: Logged-out token rejected

- **WHEN** a client calls a protected route with a logged-out or expired session token
- **THEN** the API responds `401` and the handler does not run

#### Scenario: Session maps to migrated identity

- **WHEN** an existing password user authenticates via Google account linking
- **THEN** the session resolves to the same Neon `user.id` that owns their imported customers and transactions
