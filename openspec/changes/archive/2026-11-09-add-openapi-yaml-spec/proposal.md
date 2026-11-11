# Proposal

## Why

The API's only machine-readable contract is `apps/api/openapi.json`, hand-maintained and now stale: it omits routes that already ship (books, collection, statements, exports, settings, account, sample data, dashboard analytics) and still describes removed tag endpoints and password-auth endpoints. Client authors cannot trust it, and there is no repeatable way to keep it correct as Hono routes change.

## What Changes

- Add a committed OpenAPI 3.0 document at `apps/api/openapi.yaml` that describes every mounted Ledger-X API route, its authentication requirement, request parameters/body, and response shapes.
- Add a generation script in `apps/api` that derives the document from the Hono route registrations and Zod validators rather than from a hand-edited copy, so route or validator changes surface as spec changes.
- Add a check mode so CI/local verification fails when the committed YAML drifts from what the routes/validators would generate.
- Retire the stale `apps/api/openapi.json` in favour of the generated YAML as the single source of truth.
- Document how to regenerate and validate the spec in the API/README docs.

## Capabilities

### New Capabilities

- `api-documentation`: the contract for a generated, committed OpenAPI 3.0 YAML description of the public HTTP API, including endpoint coverage, auth declarations, schema fidelity, and drift checking.

### Modified Capabilities

<!-- None: runtime API behavior does not change; this is a documentation artifact and its generation pipeline. -->

## Impact

- Affected code: `apps/api/package.json` (new scripts), `apps/api/src/**` (route metadata or a generator module), new generation script, `apps/api/openapi.yaml`, removal of `apps/api/openapi.json`.
- Affected docs: `README.md` / API documentation index.
- No runtime API behavior, database schema, deployment, web, or mobile code changes.
- New dev dependency may be needed for YAML serialization and/or OpenAPI validation.
