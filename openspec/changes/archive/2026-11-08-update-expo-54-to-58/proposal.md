# Proposal

## Why

LedgerX mobile app (`apps/app`) is pinned to Expo SDK 54 (React Native 0.81, expo-router v6), four majors behind latest (SDK 58, RN 0.88). Staying on 54 blocks iOS 27 / Xcode 27 support, Expo Go compatibility, security patches, and New Architecture–mandatory ecosystem packages. SDK 54 is the last release with legacy-architecture fallback; SDK 55+ mandates the New Architecture, so delay increases breakage risk.

## What Changes

- Upgrade `apps/app` from Expo SDK 54 → SDK 58 incrementally (54→55→56→57→58) using `npx expo install --fix` + `expo-doctor` at each step.
- Align all versioned Expo packages (`expo-constants`, `expo-font`, `expo-linking`, `expo-router`, `expo-secure-store`, `expo-sqlite`, etc.), `react-native`, `react`, `babel-preset-expo`, `eslint-config-expo`, and `expo/tsconfig.base` to SDK 58 compatibles.
- Adopt mandatory SDK 55–58 migrations: New Architecture only, React Native Strict TypeScript API (no `react-native/Libraries/*` deep imports), removed RN APIs (`InteractionManager`, `Touchable` root export, `Modal.animated`, deprecated `StatusBar` props), `expo-file-system` async `File.write`, libSQL removal, `expo-notifications` foreground-default, Android R8 minify default, iOS scene lifecycle, fingerprint `balanced` preset, `NODE_ENV` handling.
- Review expo-router v6→v7+ migration (native-tabs import path, `web.output` server default, async web routes, header transparency, optional `expo-symbols`/`@expo/ui` peers) and keep current Stack-only navigation working.
- Rebuild/verify: `tsc --noEmit`, `eslint`, `bun test`, `expo start`, Android preview build via EAS (`sdk-58` / Xcode 27.1 image), Expo Go / dev-build smoke test.

## Capabilities

### New Capabilities

- `mobile-app-runtime`: Expo SDK baseline for the LedgerX mobile app — required SDK/React Native versions, router behavior, native-build and upgrade invariants (what "on SDK 58" means and must keep working).

### Modified Capabilities

- None. No existing spec covers the mobile runtime; domain specs (`user-auth`, `user-profile`, etc.) requirements are unchanged.

## Impact

- Affected code: `apps/app/package.json`, `apps/app/app.json`, `apps/app/babel.config.js`, `apps/app/metro.config.js`, `apps/app/tsconfig.json`, `apps/app/eas.json`, root `package.json` (`babel-preset-expo`), any source using removed RN APIs or router internals.
- Dependencies: Expo SDK 58, React Native 0.88, React 19.2 (verify), expo-router v7+, EAS Build image (`sdk-58`/`latest` → Xcode 27.1).
- Systems: EAS Build (preview/production APK profiles), Expo Go / development builds, fingerprint-based native rebuild decisions.
- **BREAKING** (build-time): New Architecture mandatory; RN Strict Types default; removed RN APIs; Android R8 enabled by default; iOS scene lifecycle for prebuilt native projects.
