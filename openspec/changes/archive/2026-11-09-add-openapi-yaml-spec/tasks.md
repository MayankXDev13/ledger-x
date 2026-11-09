# Tasks

## 1. Dependencies and script wiring

- [x] 1.1 Add `yaml` and `@apidevtools/swagger-parser` as dev dependencies in `apps/api/package.json`; verification: `bun install` succeeds and both modules import in a one-off Bun script.
- [x] 1.2 Add `openapi:generate` and `openapi:check` scripts to `apps/api/package.json`; verification: `bun -e 'const p=require("./apps/api/package.json"); if(!p.scripts["openapi:generate"]||!p.scripts["openapi:check"]) process.exit(1)'` passes.

## 2. Route discovery from the live Hono app

- [x] 2.1 Create `apps/api/scripts/openapi/discover-routes.ts` that imports `createApp()`, reads `app.routes`, and returns normalized `{ method, path }` operations while excluding the explicit `MIDDLEWARE_ROUTES` list (keeping `ALL /api/auth/*`); verification: a unit test asserts the discovered set contains `GET /customers`, `POST /transactions`, `GET /dashboard/analytics`, `GET /exports/customers.csv`, and `DELETE /account`, and contains no middleware prefix such as `ALL /customers/*`.
- [x] 2.2 Add a generator test asserting every discovered route is unique and non-empty; verification: `bun test scripts/openapi/discover-routes.test.ts` passes.

## 3. Operation registry and schema models

- [x] 3.1 Create `apps/api/scripts/openapi/operations.ts` with an entry for every discovered operation (summary, tags, parameters, request body, responses, security); verification: the generator test fails with a message naming a route when an entry is removed, and passes when the registry is complete.
- [x] 3.2 Derive request-body schemas from `apps/api/src/validators.ts` with `z.toJSONSchema()` and register query parameters from the list/statement/audit/collection query schemas; verification: a test asserts the generated `createTransactionSchema` JSON Schema marks `customerId`, `amount`, and `type` required and emits the `credit|debit` enum, matching `createTransactionSchema`.
- [x] 3.3 Create `apps/api/scripts/openapi/models.ts` with response models for customers, transactions, books, settings, statements, collection rows, dashboard metrics, analytics, audit logs, pagination envelopes, and the error envelope; verification: a contract test validates representative serialized fixtures (including ISO date strings) against each model with Ajv.
- [x] 3.4 Declare the bearer security scheme and mark only authenticated operations as requiring it, leaving `/api/auth/redirect/google` and the OAuth handler paths public; verification: a test asserts `GET /customers` requires bearer auth and `/api/auth/redirect/google` does not.

## 4. Deterministic generator and committed document

- [x] 4.1 Create `apps/api/scripts/generate-openapi.ts` that builds the OpenAPI 3.0 document from discovery + registry + models and serializes YAML with sorted paths, fixed method order, and sorted component schemas; verification: running it twice against unchanged source produces byte-identical output.
- [x] 4.2 Generate and commit `apps/api/openapi.yaml`; verification: parsing the file yields `openapi: 3.0.x`, the expected `info` metadata, and all discovered paths.
- [x] 4.3 Implement `--check` mode that builds in memory, compares against `apps/api/openapi.yaml`, prints the first difference, and exits non-zero without writing; verification: editing a value in the YAML makes the check fail, and restoring it makes the check pass.

## 5. Validation and drift enforcement

- [x] 5.1 Run `@apidevtools/swagger-parser` validation in both generate and check paths before accepting the document; verification: a test with a deliberately broken document exits non-zero and reports the invalid location.
- [x] 5.2 Wire `openapi:check` into the API test/CI flow so stale specs fail the build; verification: `bun run --cwd apps/api openapi:check` and the API test command both pass on the committed spec.

## 6. Documentation and retirement of `openapi.json`

- [x] 6.1 Delete `apps/api/openapi.json`; verification: `grep -rn "openapi.json" --exclude-dir=node_modules .` returns no remaining references.
- [x] 6.2 Document the generate/check workflow and the YAML location in `README.md` and `docs/`; verification: the documented commands run exactly as written and produce the committed file unchanged.

## 7. Integration verification

- [x] 7.1 Run `bun run --cwd apps/api openapi:generate`, `bun run --cwd apps/api openapi:check`, and the API test suite; verification: all exit zero and the working tree shows no diff after generation.
- [x] 7.2 Compare the committed `paths` against `createApp().routes` output; verification: every non-middleware mounted route appears exactly once and no removed route (tags, password auth) appears.

## Workflow follow-up

- Archive the change after review and once the generated spec and check pass in CI.
