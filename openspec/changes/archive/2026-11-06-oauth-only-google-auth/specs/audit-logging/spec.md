# Spec Delta

## REMOVED Requirements

### Requirement: Auth events are audited
**Reason**: Password-based auth event set (signup, password login, password-reset request, password change) is removed with OAuth-only cutover.
**Migration**: See the new OAuth auth-events requirement; password-reset and password-change entries are no longer emitted.

## ADDED Requirements

### Requirement: OAuth auth events are audited
The system SHALL record Google OAuth first-link/signup, login, logout, and session revocation with actor, timestamp, IP/user-agent when available, and outcome. Password-reset and password-change entries SHALL NOT be emitted.

#### Scenario: Google sign-in is logged
- **WHEN** a user completes Google sign-in (including first-time account linking)
- **THEN** an audit entry records the login with actor, timestamp, and outcome

#### Scenario: Logout revocation is logged
- **WHEN** a user logs out
- **THEN** an audit entry records the logout and session revocation
