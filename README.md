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

## Root commands

```bash
bun dev        # run all dev servers (web + api; Expo is started from apps/app)
bun run build  # build web + api (Workers bundle check via wrangler dry-run)
bun run lint   # lint app + web
bun run typecheck
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

The API deploys as worker `server-v2` to `api.ledgex.mayankxdev.shop`. Production
secrets (`SUPABASE_URL`, `SUPABASE_ANON_KEY`) are set with `wrangler secret put`;
they are never committed. The Hyperdrive binding is configured in
`apps/api/wrangler.jsonc` and overridden locally through
`CLOUDFLARE_HYPERDRIVE_LOCAL_CONNECTION_STRING_HYPERDRIVE` in `.dev.vars`.
