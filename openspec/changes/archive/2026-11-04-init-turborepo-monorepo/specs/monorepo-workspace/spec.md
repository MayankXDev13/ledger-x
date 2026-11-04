# Spec Delta

## Purpose

Establishes the ledger-x monorepo contract: a bun-managed Turborepo hosting the mobile app, web app, and API as workspaces at canonical paths, with a uniform root task pipeline and runtime secrets kept out of committed configuration.

## ADDED Requirements

### Requirement: Workspaces resolve under bun
The repository SHALL manage all JavaScript packages through bun workspaces declared at the root, recorded in a single root `bun.lock`, and SHALL NOT retain pnpm lockfiles or pnpm workspace manifests.

#### Scenario: One install covers everything
- **WHEN** a developer runs `bun install` at the repository root
- **THEN** the dependencies of `apps/app`, `apps/web`, and `apps/api` are all installed from one resolution
- **AND** a single root `bun.lock` records the resolved versions
- **AND** no `pnpm-lock.yaml` or `pnpm-workspace.yaml` exists anywhere in the repository

### Requirement: Canonical app paths
The repository SHALL host the Expo mobile app at `apps/app`, the Next.js web app at `apps/web`, and the Cloudflare Workers API at `apps/api`, and each app SHALL remain runnable from its own directory.

#### Scenario: Workspaces exist at canonical paths
- **WHEN** a developer inspects the repository root
- **THEN** `apps/app`, `apps/web`, and `apps/api` each contain a package manifest recognized by the root bun workspace configuration
- **AND** the mobile app no longer occupies the root `app/` path

### Requirement: Root task pipeline
The root SHALL expose turbo-driven `dev`, `build`, `lint`, and `typecheck` tasks that run across workspaces from the repository root, and the API workspace SHALL provide its own db scripts (generate, migrate) and wrangler typegen.

#### Scenario: Root-only build and checks
- **WHEN** a developer runs `bun run build`, `bun run lint`, and `bun run typecheck` from the repository root
- **THEN** each task runs for every workspace that defines it and completes without manual per-app steps
- **AND** the Next.js web app and the Workers API are validated as buildable

#### Scenario: Root dev server workflow
- **WHEN** a developer runs the root `dev` task
- **THEN** the web and API dev servers start together, and the mobile app's Expo start remains available from `apps/app`

### Requirement: Restored feature code compiles
The recreated `apps/web` and `apps/api` SHALL include the feature modules restored from git history — web: auth, dashboard, customers, tags, and profile pages with their data hooks and api/supabase/validation utilities; api: auth, customers, transactions, and dashboard routes with auth middleware, Drizzle schema, and existing migrations — and the pipeline SHALL pass with them in place.

#### Scenario: Typecheck over restored modules
- **WHEN** `bun run typecheck` runs from the repository root
- **THEN** it succeeds with the restored feature modules present in both `apps/web` and `apps/api`

#### Scenario: Workers API is bundle-verifiable
- **WHEN** the API workspace's build task runs
- **THEN** the Workers application bundles successfully from `src` with the restored routes wired to the entrypoint

### Requirement: Secrets stay out of committed config
Committed configuration SHALL NOT contain database URLs, passwords, or API credentials; runtime secrets SHALL be sourced from gitignored local env files or Wrangler secrets.

#### Scenario: Committed config is secret-free
- **WHEN** committed wrangler or app configuration files are inspected
- **THEN** no Supabase connection string or password appears in them
- **AND** the API's local secrets file (`.dev.vars`) is listed in `.gitignore`

### Requirement: API dev and deploy workflow preserved
The API workspace SHALL provide wrangler-based dev and deploy commands that preserve the existing Hyperdrive binding and the custom-domain route from the previously deployed configuration.

#### Scenario: Local Workers dev server
- **WHEN** a developer runs the API dev command from `apps/api`
- **THEN** a local Workers dev server starts and serves the restored API routes

#### Scenario: Deploy config unchanged in behavior
- **WHEN** the API is deployed from `apps/api`
- **THEN** it deploys under the same worker name and custom domain as before, with production secrets supplied by Wrangler rather than committed files
