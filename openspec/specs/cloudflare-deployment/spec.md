# cloudflare-deployment Specification

## Purpose

Defines how the web frontend and API are deployed on Cloudflare with safe configuration and rollback.

## Requirements

### Requirement: Web deploys to Cloudflare Pages

The web app SHALL deploy from `apps/web` to Cloudflare Pages with the production build requiring `NEXT_PUBLIC_API_URL` pointing at the deployed Workers API origin.

#### Scenario: Pages build targets deployed API

- **WHEN** web is built for production with `NEXT_PUBLIC_API_URL=https://api.ledgex.mayankxdev.shop`
- **THEN** all browser API calls target that origin and no request falls back to localhost

#### Scenario: Missing API URL fails fast

- **WHEN** a production Pages build runs without `NEXT_PUBLIC_API_URL`
- **THEN** the build fails with a configuration error

### Requirement: API deploys to Cloudflare Workers

The API SHALL deploy from `apps/api` to Cloudflare Workers via Wrangler, preserving the custom domain route and Hyperdrive/Neon binding pattern, with runtime secrets supplied via Wrangler secrets or `.dev.vars` and never committed.

#### Scenario: Worker serves custom domain

- **WHEN** the API is deployed
- **THEN** it answers on the configured custom domain and health/public routes respond without auth

#### Scenario: Secrets stay out of repo

- **WHEN** configuration files are inspected in git
- **THEN** they contain no database URLs, auth secrets, or API keys

### Requirement: Environment parity and rollback

Each deployment SHALL support preview/production environments and SHALL allow rollback to the previous working deployment when post-deploy checks fail.

#### Scenario: Failed deploy rolls back

- **WHEN** post-deploy smoke checks fail on the new Worker/Pages deployment
- **THEN** traffic is routed back to the prior deployment and the failure is reported

### Requirement: Automated CD gated on CI success

The repository SHALL provide a separate continuous deployment workflow that runs automatically only after the CI workflow succeeds on `main`, and SHALL NOT run on pull requests.

#### Scenario: Passing CI on main triggers deployment evaluation
- **WHEN** the CI workflow completes with `conclusion: success` for a push to `main`
- **THEN** the CD workflow starts against the exact commit SHA verified by CI

#### Scenario: Failing CI blocks deployment
- **WHEN** the CI workflow fails or is cancelled on `main`
- **THEN** the CD workflow does not deploy either Workers or Pages

### Requirement: Path-scoped deployment targets

On automated `main` deployments, the CD workflow SHALL inspect the commit's changed files and deploy only the affected application targets.

#### Scenario: Web-only change deploys only Pages
- **WHEN** a push to `main` modifies files only under `apps/web/**`
- **THEN** only the Cloudflare Pages web deployment job runs and the Cloudflare Workers API deployment job is skipped

#### Scenario: API-only change deploys only Workers
- **WHEN** a push to `main` modifies files only under `apps/api/**`
- **THEN** only the Cloudflare Workers API deployment job runs and the Cloudflare Pages web deployment job is skipped

#### Scenario: Shared root change deploys both targets
- **WHEN** a push to `main` modifies root `package.json`, `bun.lock`, or `.github/workflows/deploy.yml`
- **THEN** both the Cloudflare Workers API and Cloudflare Pages web deployment jobs run

#### Scenario: Mobile-only or docs-only change skips both targets
- **WHEN** a push to `main` modifies only files outside `apps/api/**`, `apps/web/**`, and shared root deployment files (such as `apps/app/**` or `docs/**`)
- **THEN** both Cloudflare deployment jobs are skipped cleanly

### Requirement: Non-cancelling deploy concurrency and manual dispatch

The CD workflow SHALL prevent concurrent production deployments from cancelling in-flight runs (`cancel-in-progress: false`) and SHALL support manual `workflow_dispatch` with an explicit target selector (`all`, `api`, `web`).

#### Scenario: Manual dispatch targets one app
- **WHEN** a maintainer triggers `workflow_dispatch` with `target: web`
- **THEN** only the Cloudflare Pages web deployment job runs

#### Scenario: Manual dispatch targets both apps
- **WHEN** a maintainer triggers `workflow_dispatch` with `target: all`
- **THEN** both the Cloudflare Workers API and Cloudflare Pages web deployment jobs run

### Requirement: Automated post-deploy Worker smoke check and rollback

After deploying the Workers API, the CD workflow SHALL run `apps/api/scripts/smoke.sh` against the deployed Worker origin and SHALL execute `wrangler rollback` if the smoke check fails.

#### Scenario: Healthy Worker deployment succeeds
- **WHEN** `wrangler deploy` completes and `apps/api/scripts/smoke.sh` exits zero
- **THEN** the API deployment job succeeds without rolling back

#### Scenario: Failed smoke check triggers rollback
- **WHEN** `apps/api/scripts/smoke.sh` exits non-zero after `wrangler deploy`
- **THEN** the job runs `wrangler rollback --yes` and exits non-zero to report the deployment failure

### Requirement: Production version and deployment hash tracking

After deploying Cloudflare Workers and/or Cloudflare Pages, the CD workflow SHALL capture the Cloudflare Worker Version ID and the Cloudflare Pages unique deployment hash (and Deployment ID), record GitHub Deployments (`production-api` / `production-web`), write a consolidated Production Deployment Summary to `$GITHUB_STEP_SUMMARY`, and publish a non-latest GitHub Release (`cloud-deploy-*`) when all triggered targets succeed.

#### Scenario: Successful deployment records live version ID and Pages hash
- **WHEN** the CD workflow deploys Workers and/or Pages and all post-deploy checks pass
- **THEN** the workflow outputs the live Worker Version ID and/or Pages unique hash and Deployment ID in `$GITHUB_STEP_SUMMARY`, records GitHub Deployments, and publishes a `cloud-deploy-*` release with instant rollback instructions

### Requirement: Automated Pages smoke check and instant manual rollback

After deploying Cloudflare Pages, the CD workflow SHALL verify the deployed URL responds with HTTP 200 and SHALL roll back to the previous production Pages deployment via the Cloudflare Pages API if verification fails. The repository SHALL also provide a manual `Rollback Production` workflow (`.github/workflows/rollback.yml`) that lets developers instantly roll back `api`, `web`, or `all` to either the previous deployment or a specific Worker Version ID / Pages deployment hash or ID.

#### Scenario: Developer triggers instant production rollback
- **WHEN** a developer runs `Rollback Production` via `workflow_dispatch` with `target: api`, `web`, or `all` (optionally specifying a Worker Version ID or Pages hash/ID)
- **THEN** the workflow immediately rolls back the selected Cloudflare target(s), verifies post-rollback health, updates GitHub Deployments, and writes a Rollback Summary showing the active version/hash now serving production
