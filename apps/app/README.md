# LedgerX

[![Android APK](https://github.com/MayankXDev13/ledger-x/actions/workflows/android-apk.yml/badge.svg)](https://github.com/MayankXDev13/ledger-x/actions/workflows/android-apk.yml)

An Android ledger app for small shops: record credit and payments per customer,
see who owes what, and collect faster.

## Tech Stack

- **Frontend:** Expo SDK 58 (React Native) + TypeScript + Expo Router
- **Backend:** Cloudflare Workers API (`apps/api`) on Hono
- **Database:** Neon (Postgres) via Drizzle ORM
- **Auth:** Google OAuth only, through Better Auth (no passwords)
- **Package Manager:** Bun

## Getting Started

### 1. Install dependencies

```bash
bun install
```

### 2. Point the app at the API

Create `apps/app/.env`:

```
EXPO_PUBLIC_API_URL=https://your-worker.workers.dev
```

That is the only variable the app reads. The API issues the Google session
token; the app stores it in `SecureStore` and sends it as
`Authorization: Bearer <token>`.

### 3. Run on Android

```bash
bun --cwd apps/app android
```

This starts the Metro bundler and launches the app on a connected device or
emulator.

## Project Structure

```
app/
├── _layout.tsx          # Root layout: session, settings, flags, auth guard
├── index.tsx            # Entry route — resolves the session, then routes
├── auth/login.tsx       # Google sign-in
├── (tabs)/              # Home, Ledger, Collection, Customers, Profile
├── customers/           # Customer list, detail, add, edit, statement
├── ledger/              # Ledger entries
components/              # Reusable components (UserAvatar, AppLockGate, …)
hooks/                   # useAuth, useSettings, useInsights, …
lib/                     # API client, session provider, app lock, helpers
types/                   # TypeScript types
```

## Features

- **Authentication:** Google sign-in only; the session resolves once for the app
  and is refreshed when the app returns to the foreground.
- **Customer management:** Add, view, search, and open a customer's ledger.
- **Ledger tracking:** Record credit and payment entries per customer.
- **Balances and aging:** Outstanding totals with 0–30 / 31–60 / 60+ day aging.
- **Collections:** UPI collection with a QR code and a printable statement.
- **Offline support:** Entries recorded offline are queued and replayed.
- **App lock:** Optional device-local PIN, removed together with the session.

## Environment Variables

| Variable               | Description                        |
| ---------------------- | ---------------------------------- |
| `EXPO_PUBLIC_API_URL`  | Public origin of the Workers API   |

## Building for Production

The release APK is built by **GitHub Actions** (free for public repositories) —
no paid build service is involved:

```bash
bun --cwd apps/app build:apk
```

That triggers the **Android APK** workflow. The APK is attached to the run as an
artifact; download it from the Actions run page, then install it on a device:

```bash
adb install -r ledgerx.apk
```

The build reads `EXPO_PUBLIC_API_URL` from the workflow environment (override it
with a repository variable of the same name).

## License

MIT
