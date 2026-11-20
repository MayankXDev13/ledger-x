# Spec Delta

## ADDED Requirements

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
