# Design

## Context

See `proposal.md` for motivation. The relevant current state:

- `apps/api/src/index.ts` mounts `/auth` before a global auth middleware, hardcodes CORS to `http://localhost:3000`, and mounts the transactions router at `/transactions`.
- Tag CRUD lives inside that router at `/transaction-tags`, so it is served at `/transactions/transaction-tags` and is also shadowed by the earlier `GET /transactions/:id` route. The historical OpenAPI contract (commit `5ecb7cd`, `server/openapi.json`) defines tags at top-level `/transaction-tags`, which is what `apps/web/lib/api.ts` already calls.
- `apps/api/src/db/index.ts` creates a `pg.Client` per request, connects it, and never closes it.
- There is no `app.onError` or `app.notFound`; commit `0511e22` removed the previous handler.
- Transaction-tag association routes do not verify that the transaction or tag belongs to the caller, and transaction creation does not verify customer ownership.
- `apps/web/lib/api.ts` reads `error.response.data.error`, which becomes `[object Object]` for the current Zod field-error shape.
- There are no tests or test task; root tasks are `dev`, `build`, `lint`, `typecheck`.

Constraints: Cloudflare Workers with `nodejs_compat`, Hyperdrive, and a Supabase token verifier; bun is the package manager and task runner; the Expo app is out of scope.

## Goals / Non-Goals

**Goals:**

- Make the web app's existing API calls resolve and succeed against the current API.
- Make the API safe to deploy to a browser origin other than localhost.
- Guarantee per-request database cleanup even on failure.
- Put every cross-user read/write behind an ownership check.
- Prove the contract with tests that need no external services.

**Non-Goals:**

- Unifying the Expo app's `contacts` / `ledger_entries` model with the web/API model.
- Changing the auth provider or introducing cookies/sessions.
- Database schema or migration changes.
- CI, load testing, or observability tooling beyond existing Wrangler logs.
- Redesigning web UI or adding product features.

## Decisions

### 1. Build the app through a `createApp` factory with injectable dependencies

`createApp(deps)` accepts two dependencies with production defaults:

- `verifyToken(ctx, token)` → user or `null` (default: Supabase `auth.getUser`).
- `withDb(ctx, fn)` → runs `fn` with a Drizzle database and owns connection cleanup (default: `pg.Client` + Hyperdrive).

The module keeps `export default createApp()` so Wrangler's entrypoint is unchanged. Tests call `createApp({ verifyToken: fake, withDb: fake })` and never touch Supabase, Postgres, or the network.

**Alternatives considered:** `bun:test` module mocking (brittle and leaks between tests); `@cloudflare/vitest-pool-workers` (realistic but a second test runner and Workers config); PGlite integration tests (real SQL but a new dependency and slower suite). Dependency injection keeps the suite fast and local while leaving room for an integration test later.

### 2. Split tags into a top-level router and enforce ownership

Create `apps/api/src/routes/tags.ts` for `/transaction-tags` and `/transaction-tags/:id`. Mount it separately from `/transactions`. Keep transaction-tag association endpoints in the transactions router at `/:id/tags`, but register static/association routes before `/:id` handlers and never rely on matching order for correctness.

Ownership rules:

- Tag CRUD already filters by `userId`; keep that and add a `409` mapping for the existing `(user_id, name)` unique index.
- `GET`/`POST`/`DELETE /transactions/:id/tags*` must first resolve the transaction with `userId = caller`; a missing or foreign transaction returns `404`.
- `POST /transactions/:id/tags` must also resolve the tag with `userId = caller`; a foreign tag returns `404`.
- `POST /transactions` must resolve `customerId` with `userId = caller` before insert; a foreign customer returns `404`.

No aliases for the old `/transactions/transaction-tags` paths: no deployed consumer depends on them, and keeping both would preserve the shadowing hazard.

### 3. Scope auth middleware per protected router

Register CORS first (it answers preflight), then apply `authMiddleware` to `/customers/*`, `/transactions/*`, `/transaction-tags/*`, and `/dashboard/*` before mounting those routers. Protect `/auth/me` explicitly. Do not use a global `app.use("*", authMiddleware)` after routes; that ordering is why `/auth/me` currently always sees an empty user.

`authMiddleware` keeps returning `401` with the JSON envelope for a missing header, a malformed header, or a rejected token, and sets the user in Hono context for handlers.

### 4. Drive CORS from `TRUSTED_ORIGINS`

Parse `TRUSTED_ORIGINS` as a comma-separated, trimmed, non-empty list and default to `http://localhost:3000`. Use Hono's `cors` origin callback:

- No `Origin` header (native app, curl, server-to-server): allow.
- Origin in the allowlist: echo it.
- Otherwise: return no matching `Access-Control-Allow-Origin`.

Keep `credentials: true`, `GET/POST/PUT/DELETE/OPTIONS`, and `Content-Type`/`Authorization`. Never use `*` with credentials. The deployed web origin is supplied through the environment at deploy time; it is not committed.

**Alternative considered:** a Next.js rewrite that proxies `/api/*` and makes calls same-origin. Rejected because it only helps the web app, hides the API contract, and would not fix other browser clients.

### 5. Standardize the error envelope and map known failures

All errors return:

```json
{ "error": "Human-readable message", "details": { "field": ["reason"] } }
```

- Validation failures: `400`, with `details` from Zod `flatten().fieldErrors`.
- Auth failures: `401`.
- Missing/foreign resources: `404`.
- Tag name conflicts (`23505` on the tag unique index): `409`.
- Unknown route: `app.notFound` → `404` JSON.
- Unhandled error: `app.onError` logs the error server-side and returns `500` with `{ "error": "Internal server error" }`; no stack, SQL, or connection string.

The web client uses an `ApiError` that exposes `message` and optional `details`. The axios interceptor reads `data.error` when it is a string, falls back to `statusText`/`message`, and never stringifies an object into `[object Object]`. `NEXT_PUBLIC_API_URL` is validated in `next.config.ts` when `NODE_ENV === "production"` so a production build without it fails immediately; development keeps the localhost fallback.

### 6. Validate query parameters before querying

Add a Zod query schema for transaction listing:

- `page`: integer ≥ 1, default `1`.
- `pageSize`: integer 1–100, default `10`.
- `start` / `end`: valid dates, optional; reject `start > end`.
- Invalid values return `400` with `details`; no `NaN` reaches Drizzle.

Reuse the existing `parseBody` pattern with a new `parseQuery` helper so body and query validation behave the same.

### 7. Centralize connection cleanup in `withDb`

`withDb(ctx, fn)`:

1. Create and connect a `pg.Client` from `ctx.env.HYPERDRIVE.connectionString`.
2. Run `fn(drizzle(client, { schema }))`.
3. In `finally`, call `client.end()` and hand the promise to `ctx.executionCtx.waitUntil` so the response is not blocked. If `executionCtx` is unavailable (tests, other runtimes), await `client.end()` instead.
4. If `connect()` fails, close the client and rethrow.

Routes wrap their data access in `withDb` rather than receiving a raw client. A per-request client is the Hyperdrive-recommended pattern; a module-global client is unsafe across Workers isolates, and a pool adds lifecycle complexity without a measured need.

Tests use a fake `withDb` for route behavior and a focused unit test with an injected client factory/`executionCtx` to prove the success and failure paths close the client.

### 8. Test through HTTP with `bun test`

Add `apps/api` tests that call `createApp(...).request(...)` with fake dependencies and assert status, JSON envelope, and CORS headers. Cover:

- Trusted origin allowed, unlisted origin denied, no-origin allowed, preflight without a token.
- Missing/invalid token `401`; valid `/auth/me` `200`.
- `GET /transaction-tags` reaches tag logic, not `GET /transactions/:id`.
- Tag duplicate `409`; cross-user customer/tag/transaction access `404`.
- Validation: bad `page`, `pageSize`, and dates.
- Unknown route `404`; thrown handler `500` with a generic body.
- `withDb` closes on success and failure.

Wire `"test": "bun test"` into `apps/api/package.json`, `"test": "turbo run test"` into the root, and a `test` task in `turbo.json`. Add `@types/bun` for `bun:test` types; if `@cloudflare/workers-types` conflicts, give tests their own `tsconfig.test.json` rather than weakening the Workers types.

### 9. Document the deployment knobs

Add `TRUSTED_ORIGINS` to `apps/api/.dev.vars.example` and the README with the local default and the instruction to set the deployed web custom domain in Wrangler. Add `NEXT_PUBLIC_API_URL` guidance to `apps/web/.env.local.example`/README noting it is required for production builds.

## Risks / Trade-offs

- **CORS misconfiguration blocks the deployed web app** → document the variable, default to localhost for development, and verify preflight in tests; a missing production value fails closed rather than allowing arbitrary origins.
- **Per-request `pg.Client` overhead** → Hyperdrive pools upstream connections; correctness of cleanup and isolation is worth the small per-request cost. Revisit only with measured latency.
- **Fake-backed tests can drift from real Drizzle behavior** → keep fakes narrow, assert HTTP behavior rather than SQL, and retain the option of a PGlite or real-Postgres integration suite later.
- **Changing tag paths could break an unknown consumer** → the user confirmed no compatibility requirement; the Expo app does not call this API.
- **Error handler hides operational detail** → log the full error server-side; add request IDs only if debugging becomes painful.
- **Bun and Workers type definitions can conflict** → isolate test types in a dedicated tsconfig instead of dropping `@cloudflare/workers-types`.
- **`waitUntil` is Workers-specific** → fall back to awaiting `client.end()` when `executionCtx` is unavailable.

## Migration Plan

1. Deploy the API with `TRUSTED_ORIGINS` set to the deployed web origin; verify a preflight and an authenticated request from that origin.
2. Deploy the web app with `NEXT_PUBLIC_API_URL` set to the API custom domain.
3. No schema migration or data backfill is required.
4. Rollback is a redeploy of the previous API/web versions plus the previous env values; the old tag paths can be restored only by reverting the router split.

## Open Questions

- The exact deployed web custom domain is supplied at deploy time; it does not change the specs, design, or task breakdown.
- Whether to add CI and a real-Postgres integration suite is deferred to a later change.
