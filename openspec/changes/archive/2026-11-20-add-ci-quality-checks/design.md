# Design

## Context

See [proposal.md](./proposal.md) for motivation and scope.

Current repository state:
- Monorepo managed by Bun `1.4.0` (`packageManager: "bun@1.4.0"`) and Turborepo (`turbo.json`).
- Root scripts: `lint` (`turbo run lint`), `typecheck` (`turbo run typecheck`), `test` (`turbo run test`).
- API workspace (`apps/api`): Cloudflare Workers (`server-v2`, `wrangler.jsonc`), `openapi:check` (`bun scripts/generate-openapi.ts --check`), `deploy` (`wrangler deploy --minify`), and post-deploy smoke test (`apps/api/scripts/smoke.sh`).
- Web workspace (`apps/web`): Next.js 16 static export when `PAGES_EXPORT=1` and `NEXT_PUBLIC_API_URL` are set (`apps/web/next.config.ts`), outputting `apps/web/out` for Cloudflare Pages direct upload.
- Existing workflow: `.github/workflows/android-apk.yml` (Android APK release builds only).

## Goals / Non-Goals

**Goals:**
- Fast, secret-free, parallel CI checks (`lint`, `typecheck`, `test`, `openapi`) on every PR to `main` and push to `main`.
- Automated, CI-gated CD for Cloudflare Workers (`apps/api`) and Cloudflare Pages (`apps/web`) in a separate workflow.
- Path-scoped deployment so web-only changes deploy only Pages and API-only changes deploy only Workers.
- Automatic post-deploy smoke verification and rollback for the Workers API.

**Non-Goals:**
- Modifying `.github/workflows/android-apk.yml` or mobile build pipelines.
- Deploying Cloudflare Pages PR preview environments (Better Auth `TRUSTED_ORIGINS` is an explicit origin allowlist).
- Running database migrations (`drizzle-kit migrate`) automatically inside CD.
- Adding ESLint to `apps/api` (only `apps/web` and `apps/app` currently define a `lint` script).

## Decisions

### 1. Separate `ci.yml` and `deploy.yml` workflows
- **Decision**: Put PR/push quality checks in `.github/workflows/ci.yml` and Cloudflare deployments in `.github/workflows/deploy.yml` triggered by `workflow_run` (`workflows: ["CI"]`, `types: [completed]`, `branches: [main]`) plus `workflow_dispatch`.
- **Rationale**: Keeps `ci.yml` completely secret-free and lets PR runs use `cancel-in-progress: true`, while `deploy.yml` uses `cancel-in-progress: false` so an active deploy is never killed mid-flight.
- **Alternative considered**: Adding deploy jobs directly to `ci.yml` with `needs: [lint, typecheck, test, openapi]`. Rejected because workflow-level concurrency cannot simultaneously cancel PR runs and protect in-flight deploys without awkward dynamic expressions, and mixing secrets into the PR workflow increases blast radius.

### 2. Path-scoped change detection inside `deploy.yml`
- **Decision**: Add a lightweight `detect-changes` job in `deploy.yml` that checks out the exact `workflow_run.head_sha` (with `fetch-depth: 0` or `fetch-depth: 2` / compare against `before` SHA) and inspects `git diff --name-only` between the base commit and `head_sha`:
  - `apps/web/**` → `deploy_web=true`
  - `apps/api/**` → `deploy_api=true`
  - `package.json`, `bun.lock`, `.github/workflows/deploy.yml` → both `true`
  - On `workflow_dispatch`, honor `inputs.target` (`all`, `api`, `web`) directly without diffing.
- **Rationale**: GitHub Actions `workflow_run` does not support `paths:` filters natively. Using pure `git diff` in a small shell step avoids third-party action supply-chain dependencies and works reliably for both single-commit pushes and multi-commit merge commits on `main` (using `git diff --name-only HEAD^1 HEAD` on merge/single commits, with fallback to deploying both if parent history is unavailable).
- **Alternative considered**: Two separate `on.push.paths` workflows (`deploy-api.yml`, `deploy-web.yml`) without `workflow_run`. Rejected because `on.push` runs in parallel with CI rather than waiting for CI to pass.

### 3. Direct Wrangler CLI invocation via Bun
- **Decision**: Use `oven-sh/setup-bun@v2` (`bun-version: "1.4.0"`) + `bun install --frozen-lockfile` and invoke the workspace-installed `wrangler` binary (`bun run --cwd apps/api deploy`, `bun x wrangler pages deploy apps/web/out ...`), passing `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` via environment variables.
- **Rationale**: Uses the exact `wrangler` version pinned in `bun.lock` (`4.99.0`), matches `android-apk.yml`'s setup pattern, and avoids version skew with external wrapper actions.

### 4. Configuration defaults for Pages project & API URL
- **Decision**:
  - `NEXT_PUBLIC_API_URL`: `${{ vars.NEXT_PUBLIC_API_URL || 'https://server-v2.mayankxdev13.workers.dev' }}` (matches `android-apk.yml` and `wrangler.jsonc`).
  - `CLOUDFLARE_PAGES_PROJECT`: `${{ vars.CLOUDFLARE_PAGES_PROJECT || 'ledgerx' }}` (the Cloudflare Pages project backing `https://ledgerx-613.pages.dev`, overridable via repository variable without editing code).
- **Rationale**: Works out-of-the-box with the documented production endpoints while allowing overrides via GitHub repository variables.

### 5. Post-deploy API smoke test and rollback
- **Decision**: After `bun run --cwd apps/api deploy`, run `API_URL="${{ vars.NEXT_PUBLIC_API_URL || 'https://server-v2.mayankxdev13.workers.dev' }}" bash scripts/smoke.sh` (with `working-directory: apps/api`). If it exits non-zero, run `bun x wrangler rollback --yes` and fail the job.
- **Rationale**: Directly satisfies `cloudflare-deployment` rollback requirements using the repository's existing smoke script.

## Risks / Trade-offs

- **[Missing GitHub Secrets]** → If `CLOUDFLARE_API_TOKEN` or `CLOUDFLARE_ACCOUNT_ID` are not configured in GitHub repository secrets, `deploy-api` and `deploy-web` will fail fast with a clear Wrangler authentication error; CI (`ci.yml`) remains unaffected.
- **[Multi-commit non-merge pushes to `main`]** → `git diff --name-only HEAD^1 HEAD` inspects the last commit (or full merge diff for merge/squash commits). In `workflow_run`, the triggering push's `before` SHA is not directly exposed in the event payload; using `HEAD^1..HEAD` is accurate for squash-merge and merge-commit PR workflows (the standard GitHub flow). For multi-commit fast-forward pushes, maintainers can also use `workflow_dispatch`.
- **[`apps/api` `test` script includes `openapi:check`]** → `apps/api/package.json` currently defines `"test": "bun test && bun run openapi:check"`. Keeping it unchanged preserves local `bun run test` behavior while the dedicated `openapi` CI job provides an explicit, fast, isolated status check for OpenAPI drift.

## Migration Plan

1. Merge `.github/workflows/ci.yml` and `.github/workflows/deploy.yml`.
2. In GitHub repository settings (**Settings → Secrets and variables → Actions**):
   - Add secrets: `CLOUDFLARE_API_TOKEN` (Workers Scripts: Edit, Cloudflare Pages: Edit) and `CLOUDFLARE_ACCOUNT_ID`.
   - Optionally set variables: `CLOUDFLARE_PAGES_PROJECT` (if different from `ledgerx-613`) and `NEXT_PUBLIC_API_URL` (if using a custom domain).
3. Verify CI runs on the PR and trigger `workflow_dispatch` on `deploy.yml` after merge to confirm both targets deploy cleanly.
