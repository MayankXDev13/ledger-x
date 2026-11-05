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
   wrangler secret put BETTER_AUTH_URL   # https://api.ledgex.mayankxdev.shop
   ```
   Set `TRUSTED_ORIGINS` to the Pages URL (comma-separated allowlist).
3. Deploy: `bun run deploy` (from `apps/api`). The custom domain route
   `api.ledgex.mayankxdev.shop` is already declared in `wrangler.jsonc`.

## Web (Pages)

1. In the Cloudflare dashboard create a Pages project from `apps/web`.
   Build command: `npx @cloudflare/next-on-pages` (or `bun run build` for
   static output), output directory `.vercel/output/static`.
2. Environment: `NEXT_PUBLIC_API_URL=https://api.ledgex.mayankxdev.shop`.
   Production builds fail fast without it (see `apps/web/next.config.ts`).
3. Rollback: redeploy the previous Pages deployment; redeploy the previous
   Worker version (`wrangler rollback` / deployments tab).

## Gate

Run the smoke test before and after cutover (blocks production switch on
failure):

```bash
cd apps/api
API_URL=https://api.ledgex.mayankxdev.shop ./scripts/smoke.sh
```
