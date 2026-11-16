# Spec Delta

## ADDED Requirements

### Requirement: Failed authentication returns the user to a recoverable page

When an authentication or OAuth flow fails, the system SHALL redirect the browser back to the web login page (or to a caller-provided error page whose origin is trusted) with information about the failure. The system SHALL NOT send the user to a default framework-generated error page.

#### Scenario: Google OAuth callback fails

- **WHEN** a Google sign-in callback fails with an error such as `state_mismatch`, `access_denied`, `no_code`, or an expired state
- **THEN** the browser is redirected to the web login page with the error carried in the query string
- **AND** no default error page is shown

#### Scenario: Caller-provided error page is used

- **WHEN** a sign-in flow supplies an error redirect target whose origin is trusted by the system
- **THEN** a failure redirects to that provided target instead of the login page

#### Scenario: Untrusted error target is rejected

- **WHEN** a sign-in flow supplies an error redirect target whose origin is not trusted
- **THEN** the system ignores that target and redirects to the web login page

### Requirement: The login page explains authentication failures and offers a retry

The login page SHALL surface a failed authentication attempt as a clear, readable message and SHALL offer a way to retry sign-in. It SHALL NOT leave the user on an unexplained error state.

#### Scenario: Error information arrives at the login page

- **WHEN** the login page is opened with authentication error information in the query string
- **THEN** the page shows a message describing that sign-in failed and provides a retry action

#### Scenario: Error information is not reshown indefinitely

- **WHEN** the user has been shown the authentication error message
- **THEN** the error information is cleared from the address so a later reload does not repeat the message

### Requirement: Client-side sign-in failures remain on the login screen

When a sign-in attempt initiated on a client fails before an OAuth redirect occurs, the system SHALL keep the user on the login screen and show visible feedback. It SHALL NOT navigate the user to a separate error page.

#### Scenario: Web sign-in request fails

- **WHEN** the web sign-in action rejects because of a network or API error
- **THEN** the user remains on the login page and sees a failure message

#### Scenario: Mobile sign-in fails

- **WHEN** a social sign-in attempt from the mobile app fails
- **THEN** the user remains on the mobile login screen with visible failure feedback
