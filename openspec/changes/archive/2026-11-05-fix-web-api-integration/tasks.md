# Tasks

## 1. App factory and test wiring

- [x] 1.1 Create `apps/api/src/app.ts` exporting `createApp(deps)` with injectable `verifyToken` and `withDb`, keep a default `createApp()` export for Wrangler, and update `src/index.ts` to use it; verify `bun run typecheck` and `bun run build` pass for `apps/api`.
- [x] 1.2 Add `"test": "bun test"` to `apps/api/package.json`, `"test": "turbo run test"` to the root `package.json`, and a `test` task to `turbo.json`; verify `bun run test` from the root discovers and runs the API tests.
- [x] 1.3 Add `@types/bun` (or an isolated `tsconfig.test.json`) so `bun:test` types resolve without weakening `@cloudflare/workers-types`; verify `bun run typecheck` passes with a placeholder contract test.
- [x] 1.4 Add the shared fake helpers (`fakeVerifyToken`, `fakeWithDb`, `requestApp`) used by the contract suite; verify they import cleanly in a smoke test.

## 2. Authentication and trusted origins

- [x] 2.1 Implement the default `verifyToken(ctx, token)` against Supabase and make `authMiddleware` depend on it; verify a missing token and a rejected token both return `401` with the JSON envelope, and a valid token reaches the handler.
- [x] 2.2 Register auth middleware per protected router (`/customers/*`, `/transactions/*`, `/transaction-tags/*`, `/dashboard/*`) and protect `/auth/me` explicitly; verify `/auth/me` returns the authenticated user's `id` and `email`, and protected handlers never run without a user.
- [x] 2.3 Parse `TRUSTED_ORIGINS` (comma-separated, trimmed, default `http://localhost:3000`) and configure Hono CORS with per-origin echoing, `credentials: true`, and the required methods/headers; verify trusted, untrusted, no-`Origin`, and preflight requests through tests.
- [x] 2.4 Document `TRUSTED_ORIGINS` in `apps/api/.dev.vars.example` and the README, including that the deployed web custom domain is set at deploy time; verify the documented local command starts `wrangler dev` with the variable loaded.

## 3. Tag routing and ownership

- [x] 3.1 Extract tag CRUD into `apps/api/src/routes/tags.ts` and mount it at `/transaction-tags`; remove the nested `/transactions/transaction-tags` registration and ensure `GET /transaction-tags` is not captured by `GET /transactions/:id`.
- [x] 3.2 Keep transaction-tag associations under `/transactions/:id/tags`, register them before `/:id` handlers, and verify each association path resolves through tests.
- [x] 3.3 Add ownership checks: resolve the transaction before tag association reads/writes, resolve `customerId` before transaction creation, and resolve tag ownership before association inserts; verify foreign customer, transaction, and tag references return `404` and create nothing.
- [x] 3.4 Map duplicate tag names (`23505` on the user/name unique index) to `409` with the error envelope; verify creating or renaming to an existing name leaves the existing tag unchanged.
- [x] 3.5 Add contract tests for tag CRUD, association paths, cross-user access, and duplicate names; verify the suite fails if the `/transaction-tags` route is shadowed or an ownership filter is removed.

## 4. Error envelope and request validation

- [x] 4.1 Restore a global `app.onError` and `app.notFound`, and add a shared validation-error responder that returns `{ error, details }`; verify validation is `400`, unknown routes are JSON `404`, and a thrown handler is a generic JSON `500` with no stack or SQL text.
- [x] 4.2 Add and apply a transaction-list query schema for `page`, `pageSize`, `start`, and `end` (page ≥ 1, pageSize 1–100, valid dates, `start <= end`); verify malformed values return `400` with field details and valid values produce the expected page metadata.
- [x] 4.3 Update the web API client with an `ApiError` that reads the server `error` string and optional `details`, replacing object stringification; verify the interceptor test or a local simulated error shows the server message rather than `[object Object]`.
- [x] 4.4 Validate `NEXT_PUBLIC_API_URL` in `apps/web/next.config.ts` for production builds; verify `next build` fails with a clear message when it is unset and succeeds when it is set.
- [x] 4.5 Document `NEXT_PUBLIC_API_URL` production behavior in `apps/web/.env.local.example` and the README; verify the documented values match the build check.

## 5. Request-scoped database connections

- [x] 5.1 Implement `withDb(ctx, fn)` in `apps/api/src/db/index.ts` with connect, `fn`, and `client.end()` in `finally` via `ctx.executionCtx.waitUntil`, falling back to awaiting when `executionCtx` is unavailable; verify success and failure paths both close the client with a unit test using an injected client factory.
- [x] 5.2 Convert every route that queries the database to use `withDb`; verify `bun run typecheck` and the contract suite pass with the fake `withDb`.
- [x] 5.3 Verify the default `withDb` closes on a thrown handler error and that a failed connect still ends the client; add these assertions to the lifecycle unit test.

## 6. Integration verification

- [x] 6.1 Run `bun run typecheck`, `bun run lint`, `bun run build`, and `bun run test` from the repository root; verify all four pass with the corrected API and web client.
- [x] 6.2 Start the API with `bun run dev` and issue a preflight plus an unauthenticated request with `curl`; verify the configured origin is echoed, an unlisted origin gets no matching header, and the unauthenticated request returns the JSON `401` envelope.
- [x] 6.3 Start the web app against the local API with a valid Supabase session and exercise login → tags CRUD → a customer transaction; verify no `404` tag requests, no CORS errors, and no `[object Object]` messages.
- [x] 6.4 Update the README deployment notes with the `TRUSTED_ORIGINS` and `NEXT_PUBLIC_API_URL` values required for the deployed pair; verify the notes name both variables and the web custom domain requirement.

## Workflow follow-up

- Archive the change after review and after the deployed API and web app have been verified with the production origin.
