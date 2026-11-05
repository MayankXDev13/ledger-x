# Spec Delta

## MODIFIED Requirements

### Requirement: Root task pipeline

The root SHALL expose turbo-driven `dev`, `build`, `lint`, `typecheck`, and `test` tasks that run across workspaces from the repository root, and the API workspace SHALL provide its own db scripts (generate, migrate) and wrangler typegen.

#### Scenario: Root-only build and checks
- **WHEN** a developer runs `bun run build`, `bun run lint`, and `bun run typecheck` from the repository root
- **THEN** each task runs for every workspace that defines it and completes without manual per-app steps
- **AND** the Next.js web app and the Workers API are validated as buildable

#### Scenario: Root dev server workflow
- **WHEN** a developer runs the root `dev` task
- **THEN** the web and API dev servers start together, and the mobile app's Expo start remains available from `apps/app`

#### Scenario: Root contract test run
- **WHEN** a developer runs `bun run test` from the repository root
- **THEN** the API workspace's contract tests run without requiring a live Supabase project or Postgres instance
- **AND** a failing contract test fails the root task
