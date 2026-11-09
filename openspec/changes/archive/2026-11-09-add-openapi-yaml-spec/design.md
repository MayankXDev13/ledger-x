# Design

## Context

See `proposal.md` — Why. Current constraints found in the codebase:

- Routes are mounted in `apps/api/src/app.ts` on a Hono app. `createApp()` is importable from Bun and exposes `app.routes` (`{ method, path }`) without needing Cloudflare bindings, because defaults (`withDb`, `verifyToken`) are only referenced, not invoked.
- `app.routes` also contains middleware registrations as `ALL <prefix>` entries (e.g. `ALL /customers/*`), plus the real `ALL /api/auth/*` Better Auth handler. These need explicit handling.
- Request validation lives in `apps/api/src/validators.ts` (Zod 4), so JSON Schema for request bodies can be derived with `z.toJSONSchema()`.
- Response shapes come from Drizzle table rows (`apps/api/src/db/schema.ts`) and hand-built serializers (e.g. statements, collection, analytics); dates serialize to ISO strings over JSON.
- Error envelopes are centralized in `apps/api/src/lib/errors.ts` (`{ error, details? }`).
- The existing `apps/api/openapi.json` is stale and was committed once; it has no generation or check step.

## Goals / Non-Goals

**Goals:**

- One generated, committed `apps/api/openapi.yaml` that is the single source of truth for the HTTP contract.
- Route discovery tied to the live Hono app so added/removed routes cannot silently disappear from the spec.
- Deterministic output and a non-mutating drift check usable locally and in CI.
- Request schemas derived from the existing Zod validators rather than duplicated.

**Non-Goals:**

- Changing any route behavior, validation, or response shape.
- Serving interactive API docs (Swagger UI/Scalar) from the Worker.
- Automatically deriving response schemas from Drizzle metadata; response models stay explicit.
- Adding a typed OpenAPI-first routing framework (`@hono/zod-openapi`) or refactoring routes.

## Decisions

### Decision: Hybrid discovery — live route list plus an explicit operation registry

The generator imports `createApp()` and reads `app.routes` to discover mounted routes, then joins each route to an entry in `apps/api/scripts/openapi/operations.ts` that supplies summary, tags, parameters, request schema, and responses. Middleware `ALL` entries are excluded by an explicit `MIDDLEWARE_ROUTES` constant; `ALL /api/auth/*` is kept as a documented operation.

Alternatives considered:

- **Pure static route parsing**: brittle against Hono composition and easy to drift.
- **Pure registry**: no protection against forgetting a newly added route.
- The hybrid fails generation when a live route has no registry entry, and also when a registry entry no longer matches a live route, so both additions and removals are caught.

### Decision: Zod 4 `z.toJSONSchema` for request bodies

Request body schemas reference the existing validators (`createCustomerSchema`, `createTransactionSchema`, `settingsUpdateSchema`, `deleteAccountSchema`, etc.). Query schemas are expressed as OpenAPI `parameters` derived from `transactionListQuerySchema`, `auditQuerySchema`, `statementQuerySchema`, and `collectionQuerySchema`.

Rejected alternatives: hand-copying JSON Schema (drifts immediately) and adding `zod-openapi`/`@hono/zod-openapi` (framework-level refactor beyond scope).

### Decision: Explicit response models in one module

Response schemas are declared once in `apps/api/scripts/openapi/models.ts` as plain JSON Schemas matching the JSON serialization of Drizzle rows and serializer outputs (`Customer`, `Transaction`, `Book`, `Settings`, `Statement`, `CollectionRow`, `DashboardMetrics`, `Analytics`, `AuditLog`, `Error`, pagination envelopes). Dates are typed as `string` with `format: date-time`.

Trade-off: response models are not automatically derived. Mitigation: a contract test validates representative serialized fixtures against the models with a JSON Schema validator, and the drift check covers the document itself.

### Decision: Deterministic YAML serialization

Use the `yaml` package to stringify the document with sorted path keys, a fixed HTTP-method order (`get, post, put, patch, delete`), and alphabetically sorted component schemas. The generator writes with a trailing newline and no timestamps or environment-dependent values, so repeated runs are byte-identical.

### Decision: Check mode instead of a separate checker

`bun run openapi:generate` writes the file; `bun run openapi:check` runs the same generator in memory, compares against `apps/api/openapi.yaml`, prints the first difference, and exits non-zero without writing.

### Decision: Validate with `@apidevtools/swagger-parser`

After building, the generator validates the document against OpenAPI 3.0 with `swagger-parser` before writing, so a malformed registry cannot commit an invalid spec. This validation also runs in check mode.

### Decision: Retire `openapi.json`

Delete `apps/api/openapi.json` in the same change to avoid two conflicting contracts. Any external consumer that still fetches the JSON should move to the YAML.

## Risks / Trade-offs

- **Response models drift from serializers** → contract tests over representative fixtures plus review when route serializers change.
- **Route registry omission blocks generation** → intentional: the error names the missing `METHOD /path`, turning drift into a visible failure rather than a silent gap.
- **`app.routes` shape changes with Hono upgrades** → isolate discovery in one module and cover it with a generator test that asserts a known route count/spot checks a few paths.
- **`z.toJSONSchema` output differs across Zod minor versions** → pin Zod (already pinned in the API package) and rely on the drift check; CI would flag serialization changes.
- **Adding new dev dependencies (`yaml`, `@apidevtools/swagger-parser`, an Ajv-based test helper)** → dev-only, not bundled into the Worker (scripts are outside `src`, and Wrangler only bundles `src/index.ts`).

## Migration Plan

1. Add `yaml` and `@apidevtools/swagger-parser` as dev dependencies in `apps/api`.
2. Add the registry, response models, generator, and check scripts.
3. Generate `apps/api/openapi.yaml`; review it against the route list.
4. Add the contract test and wire `openapi:check` into the existing test/CI pipeline.
5. Delete `apps/api/openapi.json` and update docs.
6. Rollback: revert the commit; no runtime or data migration is involved.
