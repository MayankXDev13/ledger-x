# Tasks

## 1. Continuous Integration Workflow

- [x] 1.1 Create `.github/workflows/ci.yml` with `pull_request` (main), `push` (main), and `workflow_dispatch` triggers, per-ref concurrency (`cancel-in-progress: true`), `contents: read` permissions, and four parallel jobs (`lint`, `typecheck`, `test`, `openapi`) using Bun `1.4.0` and `bun install --frozen-lockfile`; verify YAML syntax parses cleanly.
- [x] 1.2 Run all four CI commands locally (`bun run lint`, `bun run typecheck`, `bun run test`, and `bun run --cwd apps/api openapi:check`) and verify every check exits zero. (Aligned `apps/web` `react`/`react-dom` to `19.3.0` to resolve the workspace hoisting mismatch in `AuthErrorBanner.test.tsx`.)

## 2. Continuous Deployment Workflow (Cloudflare Workers & Pages)

- [x] 2.1 Create `.github/workflows/deploy.yml` triggered on `workflow_run` (after `CI` succeeds on `main` pushes) and `workflow_dispatch` (`target`: `all`, `api`, `web`), with `cancel-in-progress: false` and a `detect-changes` job that maps `apps/web/**`, `apps/api/**`, and shared root files to `deploy_web` and `deploy_api` outputs; verify YAML syntax and path-detection logic.
- [x] 2.2 Implement `deploy-api` (Wrangler Workers deploy + `apps/api/scripts/smoke.sh` gate + `wrangler rollback --yes` on failure) and `deploy-web` (`PAGES_EXPORT=1` static Next.js export + `wrangler pages deploy`) in `.github/workflows/deploy.yml`; verify the static web export build (`PAGES_EXPORT=1 NEXT_PUBLIC_API_URL=https://server-v2.mayankxdev13.workers.dev bun run --cwd apps/web build`) succeeds locally.
- [x] 2.3 Update `docs/cloudflare-deploy.md` to document the automated CI/CD workflows, path-scoped deploy behavior, and required GitHub Actions secrets/variables (`CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_PAGES_PROJECT`, `NEXT_PUBLIC_API_URL`).

## 3. Verification

- [x] 3.1 Run `openspec validate add-ci-quality-checks --strict` and verify all OpenSpec artifacts pass validation.
