# Spec Delta

## ADDED Requirements

### Requirement: The lock belongs to the signed-in session

The device-local app lock SHALL exist only while a session is signed in. When the session ends, the app SHALL remove the stored PIN, the lock flag, and the failed-attempt state, so the lock never outlives the session it protects.

#### Scenario: Signing out removes the PIN

- **WHEN** a user who has set an app-lock PIN signs out
- **THEN** the stored PIN, the lock flag, and the failed-attempt state are removed from the device

#### Scenario: A session the server rejects ends the lock

- **WHEN** the app re-resolves the session and the server rejects it
- **THEN** the lock is removed along with the session

#### Scenario: The lock is off after signing back in

- **WHEN** a user signs out with a PIN set and later signs in again
- **THEN** the app lock is off and no PIN is requested
- **AND** the user can set a new PIN

### Requirement: A signed-out app never asks for a PIN

The app SHALL NOT present the lock screen while no session is signed in, so an anonymous visitor reaches the login screen instead of a PIN prompt.

#### Scenario: The app opens after a sign-out

- **WHEN** the app is opened after the user signed out
- **THEN** the login screen is shown without a PIN prompt

#### Scenario: The lock screen guards a signed-in app

- **WHEN** a signed-in user with app lock enabled opens the app
- **THEN** the lock screen appears before any ledger content is shown
