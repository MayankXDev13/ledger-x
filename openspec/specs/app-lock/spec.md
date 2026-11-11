# app-lock Specification

## Purpose

Protects a user's ledger on a shared or lost phone by requiring a PIN or biometric unlock before the app shows financial data.

## Requirements

### Requirement: Optional PIN and biometric lock

A user SHALL be able to enable app lock by setting a 4–8 digit PIN and, when the device supports it, opt into biometric unlock. Disabling app lock SHALL require entering the current PIN. When biometrics are unavailable or fail, the PIN SHALL remain a working fallback.

#### Scenario: Enabling the lock requires setting a PIN

- **WHEN** a user enables app lock
- **THEN** they are prompted to set and confirm a 4–8 digit PIN
- **AND** the next app launch requires unlock

#### Scenario: Disabling requires the current PIN

- **WHEN** a user disables app lock without the correct PIN
- **THEN** the lock remains enabled

#### Scenario: Biometrics are optional

- **WHEN** the device has no biometric support or enrollment
- **THEN** the user can still use the PIN
- **AND** no biometric prompt is shown

### Requirement: Lock enforcement and auto-lock

When app lock is enabled, the app SHALL require unlock on cold start and after the app has been in the background longer than the configured inactivity period, which SHALL default to one minute. Financial content SHALL NOT remain visible in the operating system's app-switcher snapshot.

#### Scenario: Cold start is locked

- **WHEN** the user opens the app after it was terminated
- **THEN** the lock screen appears before ledger content is shown

#### Scenario: Inactivity re-locks the app

- **WHEN** the app stays in the background longer than the configured period
- **THEN** returning to the app requires unlock again

#### Scenario: App-switcher preview hides data

- **WHEN** the app is backgrounded with app lock enabled
- **THEN** the app-switcher snapshot does not reveal balances, names, or entries

### Requirement: Secure credential storage and attempt throttling

The app lock secret SHALL be stored only in the operating system's secure storage and SHALL NOT appear in plain application storage, logs, or analytics. After five consecutive failed PIN attempts, the app SHALL impose a cooldown before accepting another attempt, increasing on further failures.

#### Scenario: Secret is not in plain storage

- **WHEN** app local storage and logs are inspected
- **THEN** neither contains the PIN or its derived secret in readable form

#### Scenario: Repeated failures are throttled

- **WHEN** the user enters an incorrect PIN five times in a row
- **THEN** further attempts are delayed by a cooldown
- **AND** the correct PIN still unlocks after the cooldown
