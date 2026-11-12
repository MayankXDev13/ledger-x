# App lock (mobile)

App lock is entirely device-local and never synced. A server compromise cannot
reveal the PIN, and losing connectivity never prevents unlocking.

## What is stored

- Only a **salted SHA-256 of the PIN** (`salt:pin` → digest, random 16-byte
  salt) in `expo-secure-store`. The plaintext PIN is never persisted anywhere.
- The failed-attempt counter (consecutive failures + cooldown deadline) is also
  in SecureStore so it survives restarts.
- Enabling/disabling the lock, the PIN, and attempts live under the
  `ledgerx_app_lock_*` keys.

## Behavior

- **Gate**: when a PIN is set, the gate covers the whole app after cold start.
  Biometrics (Face/fingerprint, via `expo-local-authentication`) unlock with
  the device PIN as fallback.
- **Auto-lock**: backgrounding the app starts a timer; returning after **60
  seconds** re-locks. Returning sooner resumes unlocked.
- **App-switcher masking**: `expo-screen-capture` keeps the snapshot opaque so
  balances are not visible in the recents preview.
- **Cooldown**: after **5 consecutive wrong PINs**, a cooldown starts at 30s
  and doubles with each further failure (60s, 120s, …). The remaining seconds
  are shown in the gate. A correct PIN resets the counter.

## The lock belongs to the signed-in session

The lock protects ledger content, and ledger content is only reachable with a
session. So the lock does not outlive the session:

- **Signing out** removes the stored PIN, the lock flag, and the failed-attempt
  state (`clearAppLock()` in `apps/app/lib/app-lock.ts`). A signed-out app goes
  straight to the login screen — no PIN prompt.
- A session the server rejects ends the lock the same way.
- Signing back in leaves the lock **off**: the user sets a new PIN if they
  want one. The Profile → **App lock** switch shows the real state, because the
  PIN is gone rather than merely hidden.
- The gate (`apps/app/components/AppLockGate.tsx`) re-reads the lock whenever the
  session changes and never locks an app that has no session.

## Setting it up and turning it off

Profile → **App lock**:

1. Toggle *Require PIN to open* on → enter a 4–6 digit PIN twice-free (one
   entry; it is hashed immediately).
2. To disable, toggle off and **confirm the current PIN**. Forgetting the PIN
   with biometrics unavailable requires reinstalling the app (data re-syncs
   from the server on next sign-in; signing out also clears the lock, so the
   gate is released without the PIN — see recovery below).

## Recovery

There is no server-side reset by design. If the PIN is forgotten **and**
biometrics are unavailable, reinstall the app: SecureStore keys are removed
with the install, and all ledger data returns from the API after signing in.
Signing out also releases the lock, because the lock ends with the session.

## Verification

- Hash/verify and cooldown math are pure and unit-tested:
  `apps/app/lib/app-lock-core.test.ts`.
- The lock's storage contract (a clear removes the PIN, the flag and the
  attempt state) is unit-tested with a mocked secure store:
  `apps/app/lib/app-lock.test.ts`.
- Device checks (cold-start lock, backgrounding past the timer, masked
  snapshot, cooldown delay, sign-out releasing the lock) require a
  simulator/device and are listed in the change's verification notes.

