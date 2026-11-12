# Spec Delta

## ADDED Requirements

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
