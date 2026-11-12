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

### Requirement: Mobile Google sign-in ends on the canonical landing route

After the Google sign-in flow completes in the system browser, the mobile app SHALL resolve the session from the server before it decides where to route, and SHALL land the user on the canonical landing route (Home). A user whose session was established SHALL NOT be shown the login screen.

#### Scenario: Google sign-in completes in the browser

- **WHEN** the user completes Google authentication in the system browser and the browser hands control back to the app
- **THEN** the app re-resolves the session and shows the canonical landing route (Home)
- **AND** the login screen is not shown

#### Scenario: Sign-in ends on the login screen by mistake

- **WHEN** the sign-in flow finishes and the session is already active
- **THEN** the app does not navigate to the login screen, directly or through a further redirect

### Requirement: The app entry route resolves against the live session

When the app is opened through its entry route (the deep link that carries the user back from the browser), the app SHALL resolve the session first and SHALL route a signed-in user to the canonical landing route (Home) and an anonymous user to the login screen.

#### Scenario: Entry route opened while signed in

- **WHEN** the app is opened through its entry route with an active session
- **THEN** the app shows the canonical landing route (Home)

#### Scenario: Entry route opened while signed out

- **WHEN** the app is opened through its entry route without a session
- **THEN** the app shows the login screen

### Requirement: Session state is current when the app returns to the foreground

The mobile app SHALL re-resolve the session when it becomes active again, including the moment the app returns from the browser during the OAuth flow, so that navigation decisions and data calls use the current session.

#### Scenario: App returns from the browser

- **WHEN** the app becomes active after the browser was used for the OAuth flow
- **THEN** the session is re-resolved before the app chooses a destination screen

#### Scenario: Session no longer valid

- **WHEN** the app returns to the foreground and the stored session is rejected by the server
- **THEN** the app shows the signed-out state and routes the user to the login screen

### Requirement: The signed-in identity carries the account profile image

The session resolved by the mobile app SHALL include the signed-in account's OAuth profile image, display name, and email address, so that screens can show the account's real identity.

#### Scenario: Session resolved for a Google account

- **WHEN** the mobile app resolves a session for a Google account
- **THEN** the session carries that account's profile image URL, display name, and email address
