# Design

## Context

`apps/app` is an Expo Router (Stack + tabs) app on SDK 54: `expo ^54.0.30`, RN `0.81.5`, React `19.1.0`, `expo-router ~6.0.21`, `babel-preset-expo ~54.0.12`, `eslint-config-expo ~10.0.0`, NativeWind 4.2.1, plus `expo-sqlite`, `expo-secure-store`, `expo-local-authentication`. No committed `android/`/`ios` dirs (CNG/prebuild flow); EAS `eas.json` has no pinned image. Current code uses `expo-status-bar` (safe), plain `Stack`, and no `react-native/Libraries/*` deep imports observed. See `proposal.md` for motivation; see `specs/mobile-app-runtime/spec.md` for behavioral contract.

## Goals / Non-Goals

**Goals:**

- Reach SDK 58 with green `expo-doctor`, `tsc`, `eslint`, `bun test`, dev-server start, and EAS Android preview build.
- Migrate all breaking changes from SDK 55–58 in one controlled pass with per-major verification.
- Keep navigation, auth gates, offline/SQLite, and secure-store behavior unchanged.

**Non-Goals:**

- No feature work, UI redesign (including Liquid Glass/header restyle adoption beyond keeping it working), or iPhone Duo / foldable optimization.
- No migration to SwiftPM, Noxcturnal transformer, Expo UI, App Intents, widgets, or PostHog integration.
- No web `server` output adoption — keep `static` export behavior if that is what the app relies on.
- No macOS support restoration.

## Decisions

1. **Incremental 54→55→56→57→58 with `expo install --fix` at each step** (not a direct jump).
   - Rationale: Expo officially recommends one-major-at-a-time to isolate breakage; four majors at once makes bisection impossible.
   - Alternative considered: direct 54→58 jump — rejected (changelog spans RN 0.81→0.88, New Architecture mandate, router core rework).
   - Per-step: `npx expo install expo@^<N>.0.0 --fix`, then `npx expo-doctor@latest`, fix, commit, run typecheck/lint/tests before next major.

2. **Use Expo upgrade skill / agent-cli if available, manual fallback otherwise.**
   - Rationale: SDK 58 blog ships an `expo-upgrade` skill covering removed APIs and dead patches; faster and matches upstream guidance.
   - Alternative: fully manual via changelogs — fallback if skill unavailable. Either way verify with `expo-doctor`.

3. **Defer Strict TypeScript migration only if blocked; default is to migrate.**
   - Rationale: RN 0.87 makes Strict API default; opt-out (`customConditions: ["react-native-legacy-deep-imports"]`) is documented for removal after RN 0.89, so carrying the debt one more cycle is costly.
   - Approach: run `tsc` early after RN bump, fix deep imports and ref instance types (`ViewInstance`, `TextInputInstance`).

4. **Keep CNG (no committed native dirs); update EAS image by alias, not pin.**
   - Rationale: no `android/`/`ios` in repo, so no native-project diff to apply; just ensure `eas.json` uses `sdk-58`/`latest` default (Xcode 27.1). Remove any `ios.enableSceneSupport` flag if present (now built-in).
   - R8: accept default `enableMinifyInReleaseBuilds=true`; add `expo-build-properties` keep rules only if release testing shows reflection breakage.

5. **Router: pin prior behavior where defaults flipped.**
   - Rationale: SDK 58 defaults `web.output: "server"` + async web routes + transparent iOS header; app is mobile-first Stack, so least-risk path is `web.output: "static"` + `apiRoutes` option if needed, `asyncRoutes: { web: false }` if chunking breaks anything, and explicit header style check.
   - Migrate `expo-router/unstable-native-tabs` → `expo-router/native-tabs` only if imported (none observed); replace any `withLayoutContext` / `expo-router/react-navigation` imports with `integrateWithRouter` / `createStandardRouterNavigator`.

## Risks / Trade-offs

- [Risk] Four-major jump surfaces compounded breakage (New Architecture mandate since SDK 55, RN 0.87/0.88 removals) → Mitigation: per-major commits + `expo-doctor` + typecheck gate; bisect by reverting one major.
- [Risk] Third-party libs (NativeWind 4.2.1, reanimated 4.1.1, SVG, QR, better-auth, supabase) incompatible with RN 0.88 → Mitigation: let `--fix` align versions; check each lib's SDK 58 support; upgrade or replace before proceeding past that major.
- [Risk] R8 minification breaks reflection in release only (debug passes) → Mitigation: test release APK on device; add ProGuard keep rules via `expo-build-properties`; escape hatch `android.enableMinifyInReleaseBuilds=false`.
- [Risk] `NODE_ENV` normalization changes `.env` file loading (now forced `development`/`production` per command) → Mitigation: audit `.env*` files and dynamic config; test `expo start` vs `expo export`/EAS flows.
- [Risk] EAS image / Expo Go lag (Go supports only latest SDK after store rollout) → Mitigation: use development builds for verification, not Expo Go, during the upgrade.
- [Trade-off] Migrating Strict Types now costs effort but avoids forced migration next cycle; carrying the opt-out is cheaper short-term but flagged for removal.

## Migration Plan

1. Commit clean tree; record baseline: `expo --version`, `expo-doctor`, `tsc`, `eslint`, `bun test`, current APK behavior.
2. For N in 55, 56, 57, 58: `npx expo install expo@^N.0.0 --fix` → `npx expo-doctor@latest` → fix packages/config → `tsc` + `eslint` + `bun test` → `expo start` smoke → commit.
3. Apply SDK 55–58 codemods: Strict Types, removed RN APIs, `File.write`/`digest`, libSQL removal, notifications handler, router import/output changes, `SceneDelegate` (prebuild only if ejected), fingerprint/`updates.maxUpdatesToKeep` review.
4. Update `eas.json` image alias if pinned; run `eas build -p android --profile preview`; install APK and smoke-test (launch, login, tabs, lock gate, offline/SQLite, printing/sharing if applicable).
5. Production rollout: same as normal release (preview-verified → production build); rollback is revert to pre-upgrade commit + rebuild on SDK 54 image since no server/data migration is involved.

## Open Questions

- None blocking. Deferrable checks during apply: exact React version SDK 58 resolves to (expect 19.2); whether `expo-symbols`/`@expo/ui` need installing for tab icons/toolbar; whether any `.env.test` flow depends on old `NODE_ENV` passthrough.
