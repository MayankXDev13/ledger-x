# Proposal

## Why

The repository currently has only a release-build workflow (`.github/workflows/android-apk.yml`), with no automated CI checks on pull requests and no automated CD for the Cloudflare Workers API or Cloudflare Pages web app. As a result, lint violations, TypeScript errors, test regressions, and OpenAPI specification drift can be merged into `main`, and deployments to Workers and Pages must be triggered manually.

## What Changes

### 1. Continuous Integration (`.github/workflows/ci.yml`)
- Trigger automatically on pull requests targeting `main`, pushes to `main`, and manual `workflow_dispatch`.
- Run four separate, parallel jobs so each verification gate reports an independent status check:
  - **Lint**: Runs `bun run lint` across workspaces via Turborepo (`apps/web`, `apps/app`).
  - **Typecheck**: Runs `bun run typecheck` across all workspaces (`apps/api`, `apps/app`, `apps/web`).
  - **Test**: Runs `bun run test` across all workspaces (`apps/api`, `apps/app`, `apps/web`) without requiring live databases or external secrets.
  - **OpenAPI**: Runs `bun run --cwd apps/api openapi:check` to validate `apps/api/openapi.yaml` against OpenAPI 3.0 and fail on drift from the Hono routes and Zod validators.
- Configure consistent CI hygiene: `ubuntu-latest`, pinned Bun `1.4.0` (matching root `packageManager`), `bun install --frozen-lockfile`, read-only `contents: read` permissions, job timeouts, and per-ref concurrency with `cancel-in-progress: true`.

### 2. Continuous Deployment (`.github/workflows/deploy.yml`)
- Keep CD in a separate workflow from CI so PR checks remain secret-free and fast, while deployments run with `cancel-in-progress: false` so an in-flight deploy is never interrupted.
- Trigger automatically via `workflow_run` after the `CI` workflow succeeds on `main`, and support manual `workflow_dispatch` with a target selector (`all`, `api`, `web`).
- Add a path-based change-detection job so only affected targets deploy on `main` pushes:
  - Changes under `apps/web/**` trigger only **Deploy Web (Cloudflare Pages)**.
  - Changes under `apps/api/**` trigger only **Deploy API (Cloudflare Workers)**.
  - Shared root changes (`package.json`, `bun.lock`, `.github/workflows/deploy.yml`) trigger both.
- **Deploy API (`deploy-api`)**:
  - Deploys `apps/api` to Cloudflare Workers via `wrangler deploy --minify` using `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`.
  - Runs the post-deploy smoke test (`apps/api/scripts/smoke.sh`) against the deployed Worker origin and triggers `wrangler rollback` if the smoke check fails.
- **Deploy Web (`deploy-web`)**:
  - Builds the static export (`PAGES_EXPORT=1 NEXT_PUBLIC_API_URL=... bun run --cwd apps/web build`) and deploys `apps/web/out` to Cloudflare Pages via `wrangler pages deploy`.
- Use repository secrets (`CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`) and optional repository variables (`CLOUDFLARE_PAGES_PROJECT`, `NEXT_PUBLIC_API_URL`) with no secrets committed to the repo.

## Capabilities

### New Capabilities
- `ci-quality-checks`: Automated GitHub Actions continuous integration checks for linting, type checking, unit/contract testing, and OpenAPI specification validation and drift detection on pull requests and `main` pushes.

### Modified Capabilities
- `cloudflare-deployment`: Add automated GitHub Actions CD requirements for Cloudflare Workers (`apps/api`) and Cloudflare Pages (`apps/web`), gated on CI success on `main`, with path-scoped target selection (deploying only changed apps), manual dispatch override, and post-deploy smoke check with rollback for the Worker.

## Impact

- **CI / CD Workflows**: Adds `.github/workflows/ci.yml` and `.github/workflows/deploy.yml`.
- **Workspace scripts**: Reuses existing root scripts (`lint`, `typecheck`, `test`), `apps/api` scripts (`openapi:check`, `deploy`, `scripts/smoke.sh`), and `apps/web` static export build (`PAGES_EXPORT=1`).
- **GitHub Repository Settings**: Requires `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` secrets (and optionally `CLOUDFLARE_PAGES_PROJECT` / `NEXT_PUBLIC_API_URL` variables).
- **Runtime & Existing Workflows**: No changes to application runtime code, database schema, or `.github/workflows/android-apk.yml`.
