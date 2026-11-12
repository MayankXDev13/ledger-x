# Proposal: Mobile Google sign-in lands on Home, the Profile screen shows the Google avatar, and signing out clears the app lock

## Why

On the mobile app, tapping **Continue with Google** opens the system browser for the
OAuth flow. When the browser returns to the app, the user is dropped back on the
**Login screen** even though the Google account was accepted and a session exists on
the server. The app's session state is never re-resolved after the browser hands
control back, so the auth guard treats the user as signed out and bounces them from
Home to `/auth/login`. The same stale-session state is why the **Profile screen shows
no profile image**: the identity is read from a session that was captured before the
Google account was linked, so the OAuth `image` never reaches the screen.

Both defects share one root cause (the session is not refreshed at the moment the
OAuth browser flow completes) and both are on the path a real shopkeeper walks on
their first run of the app.

A third defect sits on the way out: the device-local **app-lock PIN survives a
sign-out**. After signing out, the app still asks for the PIN before it shows the
login screen, so the lock guards a session that no longer exists and the next person
with the phone hits a PIN prompt instead of the login page. The lock belongs to the
signed-in session and must go when the session ends.

## What Changes

- **Mobile sign-in returns to the app, not to the login screen.**
  - The session is re-resolved from the server when the OAuth browser flow completes
    and when the app returns to the foreground, so the signed-in state is real before
    any navigation decision is taken.
  - The deep-link landing route (`/`) resolves against the live session: a signed-in
    user is sent to the canonical landing route (Home), an anonymous user to
    `/auth/login`.
  - The login screen no longer performs navigation as a side effect of rendering, and
    it re-checks the session when it regains focus, so a user who authenticated in the
    browser is never parked on the login screen.
- **Profile screen shows the real Google profile image.**
  - A shared avatar component renders the OAuth profile image (with a larger image
    variant requested from Google so it is not blurry at avatar size) and falls back
    to the user's initials when the image is missing or fails to load.
  - The Profile screen identity card shows the avatar, the display name, the email,
    and the connected-Google state, and stays correct when the session is refreshed
    after sign-in.
- **Signing out removes the app lock.**
  - When the session ends — an explicit sign-out or a session the server no longer
    accepts — the stored PIN, the lock flag and the failed-attempt state are deleted.
  - The lock is only offered to a signed-in user: a signed-out app never asks for a
    PIN, and the Profile screen shows the lock as off until the user sets a new PIN.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `user-auth`: the mobile Google sign-in flow SHALL end with a resolved session and
  the canonical landing route; a signed-in user SHALL never be returned to the login
  screen, and the deep-link entry route SHALL resolve against the live session.
- `mobile-shop-ui`: the Profile screen SHALL render the signed-in user's OAuth
  profile image with an initials fallback, and SHALL show it as part of the identity
  header together with name, email, and the connected-Google state.
- `app-lock`: the device-local lock SHALL belong to the signed-in session; when the
  session ends the PIN, the lock flag and the attempt state are removed, and a
  signed-out app SHALL NOT ask for a PIN.

## Impact

- `apps/app/lib/session-provider.tsx`: refresh the session on app foreground and
  expose an explicit "sign-in completed" update.
- `apps/app/lib/auth-session.ts`: return the authenticated user from the Google flow
  and keep the profile image in the session payload.
- `apps/app/app/auth/login.tsx`: refresh-then-navigate on sign-in; focus-aware
  redirect; no navigation during render.
- `apps/app/app/index.tsx`: session-aware deep-link landing.
- `apps/app/components/AuthGuard.tsx`: guard against bouncing an authenticated user
  back to the login screen.
- `apps/app/app/(tabs)/profile.tsx` and a new shared avatar component: profile image
  rendering with initials fallback.
- `apps/app/lib/app-lock.ts`: a way to remove the stored PIN, the lock flag and the
  attempt state.
- `apps/app/lib/session-provider.tsx`: end the session and its device-local lock
  together.
- `apps/app/components/AppLockGate.tsx`: lock only while a session exists, and
  re-evaluate the lock when the session changes.
- `apps/app/lib/`: new pure helpers (session/landing resolution, avatar source
  selection) with `bun test` coverage.
- No API, database, or web-client changes. The Google `image` value is already stored
  on the `user` row and already returned by `GET /auth/me`.
