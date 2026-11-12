# Design

## Context

See `proposal.md` — Why.

The relevant current state in the mobile app (`apps/app`):

- `lib/session-provider.tsx` resolves the session **once**, from a `useEffect` on mount.
  It exposes `refresh()` but nothing calls it after sign-in, and it has no
  `AppState` listener.
- `app/auth/login.tsx` calls `signInWithGoogle()` and then `router.replace(LANDING_ROUTE)`.
  It never tells the provider that a session now exists, so `session` stays `null`.
- `components/AuthGuard.tsx` sends a session-less user on any protected route to
  `/auth/login`. Combined with the previous point, the successful sign-in lands on
  Home and is immediately bounced back to the Login screen.
- `app/index.tsx` (the deep-link entry route that carries the user back from the
  browser) unconditionally redirects to `/auth/login`.
- `lib/auth-session.ts` runs the browser OAuth flow through the Better Auth Expo
  client plugin (`callbackURL: "/"`), which stores the session cookie in
  `SecureStore` and returns the authenticated user. `getSessionUser()` already
  returns `id`, `email`, `name`, and `image`.
- `app/(tabs)/profile.tsx` already renders `user.image` with an initials fallback.
  The identity is empty because the session that screen reads was captured before
  the Google account was linked — the same stale-session root cause.
- The server side is already correct: the Google `image` is stored on the `user`
  row (verified in Neon: real accounts carry an `lh3.googleusercontent.com` URL)
  and `GET /auth/me` returns it.
- The device-local app lock lives in `apps/app/lib/app-lock.ts` (SecureStore
  keys for the PIN record, the lock flag and the attempt state) and is
  enforced by `apps/app/components/AppLockGate.tsx`, which wraps the whole
  screen tree. The gate reads the lock once on mount and never re-reads it,
  so a lock that is switched off while the app runs keeps the app locked.
- Sign-out happens in two places today: the Profile screen's **Log out** and
  the account-deletion flow. Both call `signOut()` on the session provider.

## Goals / Non-Goals

**Goals:**
- One rule for "where does this user go": the canonical landing route, decided from
  the *current* session, never from a stale one.
- No second round trip between the browser returning and the app showing Home.
- The Profile screen always renders the account's real identity, including the
  Google profile image at a size that is not blurry.

**Non-Goals:**
- Changing the Better Auth configuration, the API contract, or the database.
- Changing the web client (its OAuth callback already targets `/dashboard` and its
  `AuthGuard` re-reads the session on mount).
- Removing the app lock, the feature flags, or any existing Profile section.
- Adding account editing (name/photo upload) — Google remains the only identity
  source.

## Decisions

### 1. The provider owns the session, and sign-in tells it directly

- **Choice**: `SessionProvider` gains a way to accept the freshly authenticated user
  (`completeSignIn(user)`), and `login.tsx` calls it with the user returned by
  `signInWithGoogle()` before navigating. The provider also listens for
  `AppState` transitions to `"active"` and calls `refresh()` when the app comes back
  to the foreground.
- **Rationale**: The OAuth flow already resolved the user on the server; pushing that
  value into the provider makes the signed-in state true *before* any navigation
  decision, which removes the bounce to `/auth/login` without an extra round trip.
  The foreground listener covers the general case (the user switched away during the
  flow, the browser was dismissed, the session was revoked elsewhere).
- **Alternatives considered**:
  - *Call `refresh()` after sign-in* — one extra `/auth/me` round trip and a window
    where the guard still sees no session. Rejected in favour of handing over the
    user we already have.
  - *Read the Better Auth client session store in the guard* — couples the app shell
    to the auth library's internal store and duplicates state. Rejected.

### 2. A background refresh never shows a spinner

- **Choice**: `loading` stays `true` only until the first resolution. A foreground
  refresh updates the user in place; it does not flip `loading`, so returning to the
  app does not blank the screen with a loader.
- **Rationale**: The guard renders a full-screen spinner while `loading` is true.
  Reusing that flag for every foreground would flash a loader over a working screen.
- **Alternatives considered**: *A separate `refreshing` flag consumed by the guard* —
  rejected, it adds a state the guard would have to reason about for no user-visible
  benefit.

### 3. The entry route resolves the session before it routes

- **Choice**: `app/index.tsx` becomes session-aware: while the session is loading it
  renders nothing (the guard's loader is already on screen), a signed-in user is
  redirected to `LANDING_ROUTE`, an anonymous user to `/auth/login`. The decision is
  expressed by a small pure helper (`resolveEntryRoute`) that is unit-tested.
- **Rationale**: The browser returns the user to the app root. Today that route
  hard-codes "go to login", which is exactly the wrong destination for an
  authenticated user and the source of the reported symptom. Resolving the session
  here removes the race between this redirect and the login screen's own redirect.
- **Alternatives considered**:
  - *Point the OAuth `callbackURL` straight at the landing route* — works in
    principle, but the deep link then encodes the route structure
    (`ledgerx:///(tabs)/home`), which breaks if the tab layout is ever renamed and
    turns a route rename into an auth bug. Rejected in favour of a stable entry
    route that resolves at runtime.
  - *Delete `app/index.tsx` and let the guard handle the root* — the guard would
    have to treat the root as a special case anyway. Rejected.

### 4. The login screen stops navigating during render

- **Choice**: `login.tsx` replaces the render-time `router.replace()` with an
  effect that redirects when a session exists, and it re-checks the session when the
  screen regains focus (`useFocusEffect`).
- **Rationale**: Navigating as a side effect of rendering is not supported by
  React and fights the router. The focus check is what rescues the user who
  authenticated in the browser and came back to a login screen that was already
  mounted.
- **Alternatives considered**: *Removing the login screen from the tree entirely
  once signed in* — the effect achieves the same result with less churn.

### 5. A shared avatar component with an explicit fallback

- **Choice**: New `components/UserAvatar.tsx` backed by a pure helper module
  `lib/avatar.ts` that exposes:
  - `avatarInitials(name, email)` — initials from the display name, else from the
    email local-part, else a neutral default.
  - `avatarImageUri(image)` — `null` for an empty or non-HTTP value; for a Google
    avatar URL, a display-size variant of the same image; any other URL unchanged.

  The component renders the image when a URI exists and falls back to the initials
  badge when the image is missing **or fails to load** (`onError`).
- **Rationale**: The Profile screen must show the Google photo, and Google hands
  over a 96px variant by default that looks blurry in an avatar-sized frame.
  Rewriting the known Google size suffix is the only way to get a crisp image
  without adding an image proxy. The load-failure fallback matters on patchy
  shop-floor connectivity, where a broken image frame is worse than initials.
- **Alternatives considered**:
  - *Keep the URL as delivered* — the avatar renders soft on high-density screens.
  - *Cache the image on disk with `expo-image`* — better performance, but a new
    dependency and cache-invalidation surface for one avatar. Rejected as out of
    scope; the plain `Image` component is enough at this size.

### 6. The decision logic is pure and unit-tested
- **Choice**: The routing decision (`resolveEntryRoute`) and the avatar helpers
  live in `lib/` as pure functions with `bun test` coverage in `apps/app`, matching
  the existing `lib/amount.test.ts` / `lib/upi.test.ts` style.
- **Rationale**: Both bugs are decision bugs — the app decided to route on a stale
  session, and the Profile screen decided to render initials because it had no
  image. Pure functions make both decisions testable without a device.

### 7. The session and its device-local lock end together

- **Choice**: `apps/app/lib/app-lock.ts` gains `clearAppLock()`, which removes the
  PIN record, the lock flag and the attempt state. The session provider calls it
  whenever the session ends — an explicit `signOut()` and a re-resolve that the
  server rejects. `AppLockGate` re-reads the lock whenever the session changes and
  never locks a signed-out app.
- **Rationale**: The provider is the single place that knows a session ended, and
  both sign-out paths (Profile → Log out, account deletion) already go through it,
  so the PIN cannot be orphaned. The gate has to re-read the lock because it
  evaluates it once on mount: without that, the app would stay locked behind a PIN
  that no longer exists.
- **Alternatives considered**:
  - *Clear the PIN in the Profile screen's logout handler* — leaves the
    account-deletion path and any future sign-out behind. Rejected.
  - *Keep the PIN and re-prompt for it after signing in* — the lock would then
    guard a session that does not exist yet, and the next person with the phone
    hits a PIN prompt at the login screen. Rejected (this is the reported bug).
  - *Ask the user whether to keep the PIN on sign-out* — one more prompt in a
    flow the user already considers finished. Rejected.

## Risks / Trade-offs

- **A foreground refresh adds one request per app resume** → Mitigation: only
  refresh when the app has been backgrounded and a signed-in session exists; the
  request is the same `/auth/me` call the app already makes at cold start.
- **The Google URL rewrite assumes the `=sNN-c` size suffix** → Mitigation: only
  rewrite when the host is a known Google image host and the suffix matches;
  everything else is used unchanged.
- **A revoked session is now detected earlier (on resume)** → Mitigation: the user
  is routed to the login screen, which is the intended outcome of a revoked
  session; the signed-out state is already a supported path.
- **The Profile header changes shape** → Mitigation: the header keeps the existing
  layout (image/initials circle, name, email, connected-Google badge) and the
  existing visual-system tokens, so the change is visible but not disruptive.
- **Clearing the PIN on sign-out lowers the device's protection** → Mitigation: the
  PIN guards *ledger content*, and no ledger content is reachable without a
  session; the login screen shows no customer, balance or entry. The trade-off is
  accepted deliberately: a PIN that outlives its session blocks the next person with
  the phone at a prompt that protects nothing.

## Migration Plan

No data, API, or configuration migration. The fix ships in the mobile app build;
rollback is the previous build. The server already stores and serves the Google
profile image.

## Open Questions

- Whether the avatar should also replace the generic person icon in the mobile tab
  bar. Deferred: it is a visual enhancement that does not affect the requirements
  in this change.
