# Ledger-X

A bun-managed Turborepo containing the Ledger-X mobile app, web app, and API.

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
bun run test   # API contract tests (no live Supabase or database required)
```

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
