# Tasks

## 1. Pure decisions for routing and avatar

- [x] 1.1 Add `resolveEntryRoute(session)` to `apps/app/lib/routes.ts` — a signed-in session resolves to `LANDING_ROUTE`, an absent session to `/auth/login`, and an unresolved session to `null` (no destination yet) — and cover all three cases in `apps/app/lib/routes.test.ts` with `bun test`.
- [x] 1.2 Add `apps/app/lib/avatar.ts` with `avatarInitials(name, email)` (initials from the display name, else the email local-part, else a neutral default) and `avatarImageUri(image)` (`null` for an empty or non-HTTP value, a display-size variant for a Google avatar URL, any other URL unchanged), and cover every branch in `apps/app/lib/avatar.test.ts` with `bun test`.

## 2. Session provider owns the live session

- [x] 2.1 Extend `SessionProvider` in `apps/app/lib/session-provider.tsx` with `completeSignIn(user)`, which stores the user returned by the OAuth flow so the signed-in state is true before any navigation decision.
- [x] 2.2 Add an `AppState` listener in the same provider that re-resolves the session when the app becomes active again, without flipping `loading` back to `true` (so a resume never shows the full-screen loader); verify with `bun test` in `apps/app` that the existing suites still pass.

## 3. Sign-in lands on Home, never on the login screen

- [x] 3.1 Update `apps/app/app/auth/login.tsx` to remove the render-time `router.replace()` and replace it with an effect-based redirect for an existing session, plus a focus-time session re-check that redirects a user who authenticated in the browser.
- [x] 3.2 In the same screen, await `signInWithGoogle()`, hand the returned user to `completeSignIn(...)`, and only then navigate to `LANDING_ROUTE`; verify on a device that a completed Google sign-in shows Home and never returns to the login screen.
- [x] 3.3 Rewrite `apps/app/app/index.tsx` as the session-aware entry route driven by `resolveEntryRoute(...)`: a signed-in user is redirected to `LANDING_ROUTE`, an anonymous user to `/auth/login`; verify that the deep link that returns from the browser opens Home for an authenticated user.
- [x] 3.4 Review `apps/app/components/AuthGuard.tsx` against the new flow so that an authenticated user is never redirected back to `/auth/login` and no redirect loop can occur between the entry route, the login screen, and the guard.
- [x] 3.5 Document the mobile session-resolution behavior (refresh on foreground, sign-in hands the user to the provider, entry route resolves before routing) in `docs/auth-migration.md`.

## 4. Profile screen shows the Google profile image

- [x] 4.1 Add `apps/app/components/UserAvatar.tsx` that renders the profile image from `avatarImageUri(...)` when one exists and falls back to the initials badge when the image is missing or fails to load, with an accessible label carrying the user's name.
- [x] 4.2 Use the avatar component in the identity header of `apps/app/app/(tabs)/profile.tsx`, showing the avatar, display name, email, and the connected-Google badge, and drop the duplicated inline image/initials block.
- [x] 4.3 Verify on a device that the Profile screen shows the Google profile photo for an account that has one, shows initials for an account without one, and shows initials when the image cannot be loaded.

## 5. Verification and quality checks

- [x] 5.1 Run `bun test`, `bun run typecheck`, and `bun run lint` in `apps/app`, and `bun run check:visual` at the repo root; verify all pass.
- [x] 5.2 Walk the full first-run path on a device or emulator: fresh install → login screen → Google sign-in in the browser → Home with data → Profile screen showing the Google avatar and identity.

## 6. Signing out clears the app lock

- [x] 6.1 Add `clearAppLock()` to `apps/app/lib/app-lock.ts` that removes the PIN record, the lock flag, and the failed-attempt state, and cover it in `apps/app/lib/app-lock.test.ts` (with the SecureStore module mocked) so `bun test` proves the PIN is gone after a clear.
- [x] 6.2 Call `clearAppLock()` from `apps/app/lib/session-provider.tsx` whenever the session ends: in `signOut()` and in `refresh()` when the server rejects the session; verify with `bun test` in `apps/app` that the existing suites still pass.
- [x] 6.3 Update `apps/app/components/AppLockGate.tsx` to re-read the lock when the session changes and to never lock an app that has no session, so a signed-out app shows the login screen instead of a PIN prompt.
- [x] 6.4 Verify on a device that a user who set a PIN can sign out and reach the login screen without the PIN prompt, that the Profile security section shows the lock as off after signing back in, and that a signed-in user with a PIN still gets the lock screen on a cold start.
- [x] 6.5 Document the "the lock belongs to the session" rule in `docs/app-lock.md` and `docs/auth-migration.md`.

