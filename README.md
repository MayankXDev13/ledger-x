# Ledger-X

A bun-managed Turborepo containing the Ledger-X mobile app, web app, and API.

A public khata (digital ledger) for small shops: record credits and payments,
share printable statements, collect via UPI QR, and export or delete your data
at any time. Web and mobile ship in lockstep on the same Workers API.

## Features

- **Single book, server-resolved** — every write lands in the user's default
  book; clients never send book references (see `docs/books.md`).
- **Payment recording** — debits carry an optional payment method
  (Cash/UPI/Other) with a distinct presentation in history views.
- **Customer statements** — API-computed statement model printed to PDF on web
  and shared as a PDF on mobile (`docs/statements.md`).
- **UPI collection** — per-customer outstanding balances with FIFO aging and a
  `upi://pay` QR/link per customer; payment completion is recorded manually
  (`docs/upi-collection.md`).
- **Dashboard analytics** — 12-month credit/paid trend, top debtors, and
  receivables aging in one endpoint (`docs/dashboard-analytics.md`).
- **Offline write queue (mobile)** — entries captured offline survive restarts
  and sync exactly once (`docs/offline-queue.md`).
- **App lock (mobile)** — device-local PIN + biometrics, auto-lock, and
  app-switcher masking (`docs/app-lock.md`).
- **Data portability** — CSV exports, a full JSON archive, and self-serve
  account deletion with audit retention (`docs/data-portability.md`).
- **Onboarding & sample data** — first-run flow plus clearly-labelled sample
  rows that never appear in exports
  (`docs/onboarding-and-sample-data.md`).

## Workspaces

| Path | Package | Stack |
| --- | --- | --- |
| `apps/app` | `@ledger-x/app` | Expo / React Native (expo-router, NativeWind) |
| `apps/web` | `@ledger-x/web` | Next.js App Router, Tailwind CSS, shadcn/radix UI |
| `apps/api` | `@ledger-x/api` | Hono on Cloudflare Workers, Drizzle ORM, Supabase Postgres via Hyperdrive |

## Requirements

- [bun](https://bun.sh) >= 1.1 (package manager and task runner)
- Node.js >= 20 (Next.js / Wrangler tooling)

## Setup

```bash
bun install
```

Environment files (both are gitignored):

```bash
cp apps/api/.dev.vars.example apps/api/.dev.vars   # API secrets for wrangler dev / drizzle-kit
cp apps/web/.env.local.example apps/web/.env.local # public Supabase + API URL for Next.js
```

Fill in the values in both files. `apps/web` requires `NEXT_PUBLIC_SUPABASE_URL` and
`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` at build time - Next.js inlines them.
`NEXT_PUBLIC_API_URL` is required for production builds (it defaults to
`http://localhost:8787` in development), so point it at the deployed API origin.

`apps/api/.dev.vars` also accepts `TRUSTED_ORIGINS`, a comma-separated list of browser
origins allowed by CORS. It defaults to `http://localhost:3000`; in production set it to
the deployed web app's custom domain (and any other trusted browser origin).

## Root commands

```bash
bun dev        # run all dev servers (web + api; Expo is started from apps/app)
bun run build  # build web + api (Workers bundle check via wrangler dry-run)
bun run lint   # lint app + web
bun run typecheck
bun run test   # API + web + mobile unit/contract tests (no live database required)
```

## Documentation index

| Doc | Covers |
| --- | --- |
| `docs/books.md` | Single-book behavior and the `GET /books` contract |
| `docs/data-portability.md` | CSV exports, JSON archive, `DELETE /account` |
| `docs/statements.md` | Statement endpoint, periods, PDF naming and sharing |
| `docs/offline-queue.md` | Mobile offline writes, queue states, replay triggers |
| `docs/upi-collection.md` | UPI configuration, intent URI, collection view |
| `docs/dashboard-analytics.md` | `GET /dashboard/analytics` blocks and UTC months |
| `docs/app-lock.md` | Mobile PIN/biometric lock, auto-lock, recovery |
| `docs/onboarding-and-sample-data.md` | First-run flow and sample-data lifecycle |
| `docs/auth-migration.md` | Google-only Better Auth sign-in contract |
| `docs/audit-logs.md` | Audit event types and retention |
| `docs/cloudflare-deploy.md` | Workers/Pages deployment runbook |
| `docs/cutover.md` | Supabase → Postgres cutover runbook |
| `docs/backup-r2.md` | Backup and restore procedures |
| `docs/tags-removal.md` | Tags feature removal record |
| `docs/api-specification.md` | Generated OpenAPI 3.0 contract and drift checks |

## Per-workspace commands

```bash
# Mobile
cd apps/app && bun run start        # Expo dev server
cd apps/app && bun run android      # or: bun run ios
cd apps/app && bun run build:apk    # EAS preview build

# Web
cd apps/web && bun run dev
cd apps/web && bun run build

# API
cd apps/api && bun run dev          # wrangler dev (loads .dev.vars)
cd apps/api && bun run deploy       # wrangler deploy
cd apps/api && bun run db:generate  # drizzle-kit generate
cd apps/api && bun run db:migrate   # drizzle-kit migrate (uses DATABASE_URL from .dev.vars)
cd apps/api && bun run db:studio
cd apps/api && bun run cf-typegen
cd apps/api && bun run openapi:generate # regenerate openapi.yaml
cd apps/api && bun run openapi:check    # fail if openapi.yaml is stale
```

## Deployment

The API deploys as worker `server-v2` to `api.ledgex.mayankxdev.shop`. The web app must
be built against that origin and the API must allow the web app's custom domain:

1. Build the web app with `NEXT_PUBLIC_API_URL` set to the deployed API origin, for
   example `NEXT_PUBLIC_API_URL=https://api.ledgex.mayankxdev.shop`. Next.js inlines
   this value, and a production build fails when it is missing. Also provide
   `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` at build time.
2. Set the API's `TRUSTED_ORIGINS` to the deployed web custom domain (the exact
   scheme + host, no path), for example `TRUSTED_ORIGINS=https://ledger.example.com`.
   Use a comma-separated list for multiple browser origins. If unset, it defaults to
   `http://localhost:3000`, so the deployed web app cannot call the API. Set it as a
   Worker variable/secret alongside `SUPABASE_URL` and `SUPABASE_ANON_KEY` (the
   Supabase values are set with `wrangler secret put`; none are committed).
3. Deploy the API with `cd apps/api && bun run deploy`, then deploy the web build.

The Hyperdrive binding is configured in `apps/api/wrangler.jsonc` and overridden
locally through `CLOUDFLARE_HYPERDRIVE_LOCAL_CONNECTION_STRING_HYPERDRIVE` in
`.dev.vars`.
