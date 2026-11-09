# API specification

`apps/api/openapi.yaml` is the machine-readable OpenAPI 3.0 contract for the
Ledger-X API. It is generated from the code and committed; do not edit it by
hand.

## Commands

Run from `apps/api`:

```bash
bun run openapi:generate   # regenerate apps/api/openapi.yaml
bun run openapi:check      # fail if the committed YAML is stale
```

`bun run test` runs the API tests and then `openapi:check`, so a route or
validator change that was not regenerated fails the build.

## What drives the document

- **Routes** — `scripts/openapi/discover-routes.ts` imports `createApp()` and
  reads `app.routes`. Middleware registrations and the reserved `410` password
  stubs are filtered out; the Better Auth wildcard (`ALL /api/auth/*`) is kept.
- **Operation metadata** — `scripts/openapi/operations.ts` supplies summaries,
  tags, parameters, request bodies, responses, and auth requirements. A
  discovered route with no metadata fails generation, and metadata for a route
  that no longer exists fails too.
- **Requests** — body and query schemas come from `src/validators.ts` through
  Zod's `z.toJSONSchema`, so validation and documentation share one definition.
- **Responses** — `scripts/openapi/models.ts` declares the JSON shapes emitted
  by the handlers, with dates as ISO `date-time` strings and the shared error
  envelope.
- **Validation** — `@apidevtools/swagger-parser` validates the generated
  document before it is written or compared.

## Adding or changing a route

1. Add or update the Hono route and its Zod validator.
2. Update `scripts/openapi/operations.ts` (and `models.ts` for a new response
   shape).
3. Run `bun run openapi:generate`.
4. Review the diff in `apps/api/openapi.yaml` and commit it with the code.
