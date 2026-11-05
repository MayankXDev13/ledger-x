# Proposal

## Why

The web app and API were restored from history but their contract drifted: the tags page cannot reach its endpoints, the deployed web origin is blocked by a localhost-only CORS policy, `/auth/me` can never return a user, and the API has no error containment or database-connection lifecycle. The pipeline is green, but the web/API pair is not trustworthy end-to-end.

## What Changes

- **BREAKING**: Serve tag CRUD from the intended top-level `/transaction-tags` paths defined by the original OpenAPI contract, and stop mounting tag routes beneath `/transactions` where `GET /transactions/:id` shadows them.
- Make browser origins configurable through `TRUSTED_ORIGINS` (comma-separated, defaulting to `http://localhost:3000`) instead of hardcoding localhost, so the deployed web app can call the deployed API.
- Put `/auth/me` behind authentication and make it return the authenticated user's id and email.
- Return a consistent JSON error envelope for validation failures, not-found responses, authentication failures, and unhandled errors; never leak stack traces or driver errors.
- Validate pagination and date-range query parameters, cap the page size, and reject malformed values with `400` instead of producing `NaN` offsets.
- Close each request's Postgres client when the request finishes, including when a handler throws.
- Update the web API client to read the new error envelope and surface a useful message; require `NEXT_PUBLIC_API_URL` in production instead of silently falling back to localhost.
- Add request-level API tests using a `createApp` factory with injected database/auth dependencies, runnable with `bun test`, and expose a root turbo `test` task.
- Document `TRUSTED_ORIGINS` and the deployed-origin configuration in the environment examples and README.

## Capabilities

### New Capabilities

- `web-api-integration`: Owns the contract between the Next.js web app and the Hono API on Cloudflare Workers: canonical route paths, bearer-token authentication, trusted-origin CORS, the JSON error envelope, request-parameter validation, database-connection lifecycle, and contract-level tests.

### Modified Capabilities

- `monorepo-workspace`: The root task pipeline gains a `test` task so API contract tests run from the repository root alongside `dev`, `build`, `lint`, and `typecheck`.

## Impact

- **`apps/api`**: app entrypoint becomes a `createApp` factory; CORS reads `TRUSTED_ORIGINS`; auth middleware is scoped to protected routes; tag routes move to their own router at `/transaction-tags`; global error handler and 404 handler are restored; `getDb` closes its client; pagination/date validation is added; new tests and test helpers.
- **`apps/web`**: `lib/api.ts` parses the error envelope and `NEXT_PUBLIC_API_URL` becomes mandatory for production builds. The existing tag calls already target `/transaction-tags`, so no page-level changes are expected.
- **Configuration**: `apps/api/.dev.vars.example` and README document `TRUSTED_ORIGINS`; `turbo.json`, root `package.json`, and `apps/api/package.json` gain test wiring.
- **Deployment**: the deployed web custom domain must be added to `TRUSTED_ORIGINS`; the exact domain is supplied at deploy time and is not hardcoded in the repository.
- **Out of scope**: the Expo app's separate Supabase `contacts`/`ledger_entries` data model and its unification with this API; new product features; CI pipelines.
