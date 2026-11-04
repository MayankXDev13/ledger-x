# Proposal

## Why

The repo grew into three independently-managed apps with conflicting package managers and lockfiles: the Expo mobile app lives at the repo root (`app/`, bun), while the Next.js web app (`web/`, pnpm) and the Hono API (`server/`, pnpm) were managed as separate pnpm workspaces and have since been deleted from the working tree. There is no single install, no shared task pipeline, and no consistent way to run, build, lint, or typecheck the products together. Consolidating everything into a bun-managed Turborepo gives one install, one lockfile, and orchestrated `dev`/`build`/`lint`/`typecheck` tasks across all three apps while restoring the deleted `web` and `api` code as first-class workspaces.

## What Changes

- Introduce a Turborepo at the repo root: root `package.json` with bun workspaces, `turbo.json` task pipeline, single root `bun.lock`; bun becomes the only package manager (no pnpm workspaces remain).
- **BREAKING**: Move the existing Expo/mobile app `app/` → `apps/app` and rename its package from `ledger-x` to `@ledger-x/app`; its scripts, deps, and Expo config are unchanged.
- **BREAKING**: Recreate the deleted web app at `apps/web` as Next.js (App Router, React 19, Tailwind v4, shadcn/radix UI, TanStack Query, axios) and selectively restore from git history: auth pages (login / signup / forgot-password / reset-password), dashboard, customers, tags, profile pages, their data hooks (`useAuth`, `useCustomers`, `useTransactions`, `useDashboard`, `useTags`), and `lib/api.ts`, `lib/supabase.ts`, `lib/utils.ts`, `lib/validation.ts`.
- **BREAKING**: Recreate the deleted API at `apps/api` as Hono + Drizzle ORM + Supabase Postgres (via Cloudflare Hyperdrive), deployed to Cloudflare Workers, and selectively restore: route modules (`auth`, `customers`, `transactions`, `dashboard`), auth middleware, CORS setup, Drizzle schema and existing migrations, validators, and `db:*` / `cf-typegen` scripts.
- Remove previously committed secrets: the old `wrangler.jsonc` contained database credentials in `vars`; configuration is recreated with secrets sourced from gitignored `.dev.vars` / Wrangler secrets instead.
- Define turbo tasks (`dev`, `build`, `lint`, `typecheck`) for all three apps so `bun dev`, `bun run build`, etc. work from the repo root.

## Capabilities

### New Capabilities

- `monorepo-workspace`: Owns the requirements for the bun + Turborepo workspace layout and the cross-app task pipeline — that the app/web/api workspaces exist at their canonical paths, that bun is the sole package manager with one root lockfile, and that root-level turbo tasks (`dev`, `build`, `lint`, `typecheck`) run each workspace correctly, including the Cloudflare Workers dev/deploy workflow for the API.

### Modified Capabilities

<!-- openspec/specs is currently empty; no existing capability requirements change. -->

## Impact

- **Code layout**: `app/` moves to `apps/app`; `web/` and `server/` are recreated as `apps/web` and `apps/api` with content restored from git history (`HEAD` still holds the deleted code). Old root-level `pnpm-workspace.yaml` files inside each deleted app are not carried over.
- **Packages**: `apps/web` keeps name `web` (or `@ledger-x/web`); `apps/api` package formerly `server-v2` is renamed to `@ledger-x/api`; wrangler worker name stays `server-v2` unless deployment config says otherwise.
- **Deployment**: Workers config moves with the api workspace; the custom-domain route (`api.ledgex.mayankxdev.shop`) and Hyperdrive binding are preserved. Nothing about the Supabase/Postgres backend changes.
- **Dependencies**: three locks collapse into one root `bun.lock`; turbo is added as a root dev dependency.
- **Developer workflow**: root commands via turbo/bun replace per-app pnpm commands; per-app scripts remain runnable from their own directories.
