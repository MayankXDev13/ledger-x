# mobile-app-runtime Specification

## Purpose

Defines what it means for the LedgerX mobile app to run on a supported Expo SDK baseline, so upgrades preserve user-visible behavior while keeping builds, types, and native tooling compatible.

## Requirements

### Requirement: Supported SDK baseline

The system SHALL run the mobile app on Expo SDK 58 with its aligned React Native, React, expo-router, and versioned Expo packages as resolved by `npx expo install --fix`.

#### Scenario: Baseline versions resolved

- **WHEN** `npx expo install expo@^58.0.0 --fix` and `npx expo-doctor@latest` run in `apps/app`
- **THEN** `expo`, `react-native`, `react`, `expo-router`, and all `~`-pinned Expo packages resolve to SDK 58 compatibles with zero doctor errors

#### Scenario: Clean install reproduces baseline

- **WHEN** a fresh `bun install` (or `npm install`) runs from a clean lockfile
- **THEN** dependency resolution succeeds without peer-conflict errors on the SDK 58 set

### Requirement: App launch and navigation parity

The system SHALL preserve existing launch and navigation behavior on SDK 58: root `Stack` with `headerShown: false`, `AuthGuard` redirects, `AppLockGate`, tab screens, and `expo-status-bar` styling.

#### Scenario: Cold start navigation

- **WHEN** the app launches on a development build or EAS preview APK
- **THEN** the root layout mounts, safe-area insets apply, and unauthenticated users route to auth while authenticated users reach tabs without crash or blank screen

#### Scenario: Router defaults reviewed

- **WHEN** the upgrade changes expo-router defaults (`web.output`, async web routes, native-tabs import, header transparency)
- **THEN** the app explicitly pins the prior behavior or accepts the new default with no broken navigation, and `expo start` shows no router migration warnings

### Requirement: Strict TypeScript compliance

The system SHALL pass `tsc --noEmit` under React Native Strict TypeScript API defaults with no `react-native/Libraries/*` deep imports and instance-type refs.

#### Scenario: Typecheck passes

- **WHEN** `tsc --noEmit` runs in `apps/app` after the upgrade
- **THEN** it completes with zero errors

#### Scenario: No legacy deep imports

- **WHEN** the codebase is searched for `react-native/Libraries/` imports or `Touchable` root-export types
- **THEN** no matches remain unless explicitly opted out via `customConditions` with a recorded reason

### Requirement: Native build parity

The system SHALL produce installable Android preview and production builds on the SDK 58 EAS image with the default R8 minification and fingerprint `balanced` preset unless explicitly opted out.

#### Scenario: EAS preview build succeeds

- **WHEN** `eas build -p android --profile preview` runs with `sdk-58`/`latest` (Xcode 27.1) image
- **THEN** the build completes and the APK installs and launches without native crash

#### Scenario: Reflection-safe release build

- **WHEN** a release build enables R8 by default
- **THEN** all runtime paths using reflection (e.g. reanimated, SVG, QR) keep working, or ProGuard keep rules are added via `expo-build-properties`

### Requirement: No removed or deprecated API usage

The system SHALL NOT rely on APIs removed in RN 0.87/0.88 or SDK 58: `InteractionManager`, `Touchable` root export, `Modal.animated`, deprecated `StatusBar` props, `File.write` sync semantics, or libSQL sync APIs.

#### Scenario: Removed-API audit

- **WHEN** the codebase is audited for `InteractionManager`, `Modal animated`, `backgroundColor`/`translucent` on `StatusBar`, `File.write(` without await, and `syncLibSQL`/`libSQLOptions`
- **THEN** each occurrence is migrated (`requestIdleCallback`, `ViewProps`, removed prop, `File.writeSync` or awaited `File.write`, removed libSQL usage) and lint shows no deprecated usage

#### Scenario: Notifications and filesystem behavior preserved

- **WHEN** notification foreground handling and file digest/write paths execute
- **THEN** behavior matches prior release (foreground display per `setNotificationHandler`, hashes via `File.digest`) with no silent drops or unhandled promise rejections
