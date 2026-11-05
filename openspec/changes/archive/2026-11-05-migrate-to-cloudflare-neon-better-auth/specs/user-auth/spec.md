# Spec Delta

## Purpose

Replaces Supabase Auth with Better Auth for email/password identity while preserving per-user data isolation.

## ADDED Requirements

### Requirement: Email/password signup and login via Better Auth

The system SHALL provide email/password signup, login, and logout through Better Auth, issuing a session token that the web client sends as `Authorization: Bearer <token>`.

#### Scenario: New user signs up and calls API

- **WHEN** a user signs up with a valid email and password and then calls `GET /auth/me` with the session token
- **THEN** the API returns `200` with that user's `id` and `email`

#### Scenario: Invalid credentials rejected

- **WHEN** login uses a wrong password or unknown email
- **THEN** the system returns an authentication error and issues no session

### Requirement: Password-reset migration for Supabase users

Every migrated Supabase user SHALL authenticate only after completing a password-reset flow, since password hashes are not importable. The reset email SHALL be sent to the user's migrated email address.

#### Scenario: Migrated user resets password

- **WHEN** a migrated user requests reset for their Supabase email and follows the link with a new password
- **THEN** they can log in with the new password and access their migrated data

#### Scenario: Old Supabase session rejected

- **WHEN** a client presents a pre-migration Supabase access token after cutover
- **THEN** the API responds `401` with the JSON error envelope

### Requirement: Session validation and revocation

The API SHALL validate the Better Auth session on every protected request and SHALL revoke sessions on logout and password change, rejecting revoked or expired tokens with `401`.

#### Scenario: Logged-out token rejected

- **WHEN** a client calls a protected route with a logged-out or expired session token
- **THEN** the API responds `401` and the handler does not run

#### Scenario: Session maps to migrated identity

- **WHEN** a migrated user authenticates after reset
- **THEN** the session resolves to the same Neon `user.id` that owns their imported customers and transactions
