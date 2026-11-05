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
