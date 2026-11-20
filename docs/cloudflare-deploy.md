# Cloudflare deploy: Pages (web) + Workers (API)

## API (Workers)

1. Create a Hyperdrive config pointing at the Neon pooled connection string:
   ```bash
   wrangler hyperdrive create ledgerx-neon --connection-string="$NEON_POOL_URL"
   ```
   Put the returned `id` in `apps/api/wrangler.jsonc` (`hyperdrive[0].id`).
2. Set secrets (never commit):
   ```bash
   wrangler secret put BETTER_AUTH_SECRET
   wrangler secret put BETTER_AUTH_URL   # https://server-v2.mayankxdev13.workers.dev
   ```
   Set `TRUSTED_ORIGINS` to the Pages URL (comma-separated allowlist).
   Set `WEB_APP_URL` to that same Pages origin (e.g.
   `https://ledgerx-613.pages.dev`). Failed OAuth callbacks redirect to
   `<WEB_APP_URL>/login`, and Better Auth only accepts the target when its
   origin is in `TRUSTED_ORIGINS`.
3. Deploy: `bun run deploy` (from `apps/api`). The Worker is
   `server-v2`, so its origin is `https://server-v2.mayankxdev13.workers.dev`.
   The `api.ledgex.mayankxdev.shop` custom domain is still commented out in
   `wrangler.jsonc` — that zone is not on this Cloudflare account yet.

## Web (Pages)

1. In the Cloudflare dashboard create a Pages project from `apps/web`.
   Build command: `PAGES_EXPORT=1 bun run build` (static export per
   `apps/web/next.config.ts`), output directory `out/`.
2. Environment: `NEXT_PUBLIC_API_URL=<deployed API origin>`.
   Production builds fail fast without it (see `apps/web/next.config.ts`).
3. Add the Pages URL to the API's `TRUSTED_ORIGINS` in
   `apps/api/wrangler.jsonc` (currently includes
   `https://ledgerx-613.pages.dev`) and redeploy the API, or browser
   calls will be blocked by CORS.
4. Rollback: redeploy the previous Pages deployment; redeploy the previous
   Worker version (`wrangler rollback` / deployments tab).

## Gate

Run the smoke test before and after cutover (blocks production switch on
failure):

```bash
cd apps/api
API_URL=https://server-v2.mayankxdev13.workers.dev ./scripts/smoke.sh
```

Google is the sole sign-in method, so the password endpoints return `410` and
the script asserts that. The authenticated half of the gate needs a real
session token — sign in once through Google and pass it in:

```bash
API_URL=https://server-v2.mayankxdev13.workers.dev \
SMOKE_TOKEN=<session-token> ./scripts/smoke.sh
```

Without `SMOKE_TOKEN` the script runs the unauthenticated checks only and says
so, rather than reporting a false pass.

## Automated CI / CD (GitHub Actions)

- **CI** (`.github/workflows/ci.yml`) runs four parallel checks on pull requests
  targeting `main` and pushes to `main`: **Lint**, **Typecheck**, **Test**, and
  **OpenAPI** (`bun run --cwd apps/api openapi:check`).
- **CD** (`.github/workflows/deploy.yml`) runs automatically after `CI` succeeds
  on a push to `main` (or manually via `workflow_dispatch` with `target`:
  `all`, `api`, or `web`).
  - Changes under `apps/web/**` deploy only **Cloudflare Pages**, capture the
    unique deployment hash (`https://<hash>.<project>.pages.dev`) and full
    Deployment ID, and verify HTTP 200 (automatically rolling back to the
    previous production Pages deployment on failure).
  - Changes under `apps/api/**` deploy only **Cloudflare Workers**, capture the
    Cloudflare **Worker Version ID**, and run `apps/api/scripts/smoke.sh`
    (rolling back via `wrangler rollback --yes` on failure).
  - Changes to root `package.json`, `bun.lock`, `.github/workflows/deploy.yml`,
    or `scripts/cloudflare/**` deploy both targets.
  - Every deployment records GitHub Deployments (`production-api` /
    `production-web`), writes a **Production Deployment Summary** in the
    GitHub Actions Job Summary with the live Worker Version ID and Pages unique
    hash/ID, and (when all triggered targets succeed) publishes a
    `cloud-deploy-*` GitHub Release (with `--latest=false`) containing the live
    identifiers and instant rollback commands.
- **Instant Rollback** (`.github/workflows/rollback.yml` — **Rollback Production**)
  lets a developer immediately roll back `api`, `web`, or `all` from GitHub
  Actions (`workflow_dispatch`):
  - Leave `worker_version_id` or `pages_deployment_id` blank to revert to the
    previous healthy deployment, or paste a specific Worker Version ID / Pages
    unique hash (or full Deployment ID).
  - Local CLI equivalents:
    ```bash
    # Roll back Workers API to a specific Version ID (or omit ID for previous)
    bun x --cwd apps/api wrangler rollback <version-id> --yes --message "Rollback reason"

    # Roll back Pages Web to a specific hash / Deployment ID (or omit --target for previous)
    bun run scripts/cloudflare/cloudflare-ops.ts pages-rollback --project ledgerx --target <hash-or-id>
    ```

### Required GitHub Actions Secrets & Variables

- Secrets:
  - `CLOUDFLARE_API_TOKEN` (permissions: **Workers Scripts: Edit**, **Cloudflare Pages: Edit**)
  - `CLOUDFLARE_ACCOUNT_ID`
- Optional repository variables:
  - `CLOUDFLARE_PAGES_PROJECT` (defaults to `ledgerx`)
  - `NEXT_PUBLIC_API_URL` (defaults to `https://server-v2.mayankxdev13.workers.dev`)
