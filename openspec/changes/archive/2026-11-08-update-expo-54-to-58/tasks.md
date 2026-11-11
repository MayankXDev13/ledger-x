# Tasks

## 1. Baseline and preparation

- [x] 1.1 Record pre-upgrade baseline in `apps/app` (expo version, `expo-doctor`, `tsc --noEmit`, `eslint .`, `bun test`) and verify all currently pass or record known failures
- [x] 1.2 Audit removed/deprecated API usage (`InteractionManager`, `Touchable` root export, `Modal animated`, RN `StatusBar` props, `react-native/Libraries/*`, `withLayoutContext` / `expo-router/react-navigation`, `unstable-native-tabs`, `syncLibSQL`, `File.write`) and verify audit list is complete

## 2. Incremental SDK upgrade 54 → 58

- [x] 2.1 Upgrade to Expo 55 (`npx expo install expo@^55.0.0 --fix`, `npx expo-doctor@latest`) and verify doctor is clean plus `tsc --noEmit` passes
- [x] 2.2 Upgrade to Expo 56 and verify doctor clean plus `eslint .` and `bun test` pass in `apps/app`
- [x] 2.3 Upgrade to Expo 57 and verify `expo start` launches without router/migration warnings
- [x] 2.4 Upgrade to Expo 58 (`npx expo install expo@^58.0.0 --fix`) and verify `npx expo-doctor@latest` reports zero errors

## 3. Breaking-change migrations

- [x] 3.1 Migrate React Native Strict TypeScript API (remove deep imports, fix ref instance types) and verify `tsc --noEmit` passes with no legacy opt-out
- [x] 3.2 Replace removed RN / Expo APIs (`InteractionManager` → `requestIdleCallback`, `Touchable` types → `ViewProps`, `File.write` → awaited/`writeSync`, `File.md5` → `File.digest`, remove libSQL usage) and verify grep audit shows zero remaining usages
- [x] 3.3 Review expo-router migration (native-tabs import, `web.output`, async routes, header appearance, optional `expo-symbols`/`@expo/ui` peers) and verify navigation smoke (launch, auth redirect, tabs) works on a dev build
- [x] 3.4 Align configs (`babel-preset-expo`, `eslint-config-expo`, `expo/tsconfig.base`, `app.json` plugin list, `NODE_ENV`/`.env` handling, fingerprint `balanced` awareness) and verify `eslint .` and `bun test` pass

## 4. Native build and release verification

- [x] 4.1 Update EAS build image to `sdk-58`/`latest` if pinned and verify `eas build -p android --profile preview` completes successfully
- [x] 4.2 Smoke-test preview APK on device (cold start, login, tabs, AppLockGate, offline/SQLite, sharing/printing) and verify no native crash or R8/reflection regression
- [x] 4.3 Run full verification (`expo-doctor`, `tsc --noEmit`, `eslint`, `bun test`, `expo start` smoke) on the final SDK 58 tree and verify all green
