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
