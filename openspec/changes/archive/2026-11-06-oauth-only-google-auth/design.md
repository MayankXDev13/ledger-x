# Design

## Context

See proposal.md Why. Current state differs from the original draft of this
design: the Better Auth instance in `apps/api/src/lib/better-auth.ts` is
**dead code** — nothing imports it and no handler is mounted. Live auth is
fully custom Hono code: password handlers in `apps/api/src/routes/auth.ts`
(signup/login/logout/change/reset) with SHA-256 `account.password` rows
(`providerId=credential`), and Bearer verification in
`apps/api/src/middleware/authmiddleware.ts` via `lib/auth.ts` against the
`session` table. Web (`apps/web/lib/auth.ts`) and Expo
(`apps/app/lib/auth-session.ts`) call the custom `/auth/*` endpoints
directly. DB access on Workers is per-request through Hyperdrive
(`createWithDb`); there is no usable module-level `process.env` database
pool. The API contract `bun run test` runs offline with `FakeDb`.

## Goals / Non-Goals

**Goals:**
- Google is the only sign-in path on web and mobile; passwords stop working everywhere.
- Existing password user keeps the same `user.id` and data after first Google sign-in.
- `Authorization: Bearer <token>` contract and per-user isolation stay unchanged.
- Request-scoped DB connections are preserved (no leaked pools).

**Non-Goals:**
- Multi-provider SSO, domain restriction, or admin user management.
- Re-exporting/deleting historical password audit rows (they stay; only new emissions change).
- Migrating the mobile data layer off Supabase (tracked follow-up in `docs/auth-migration.md`); mobile auth moves to the API token.

## Decisions

- **Per-request `getAuth(env)` factory, not the module singleton**, over
  reusing `lib/better-auth.ts` as-is. Rationale: Workers have no
  `process.env` secrets at module scope and DB must come from
  `c.env.HYPERDRIVE` per request. Alternative (module-level Pool) leaks
  connections and cannot read Worker secrets.
- **Mount the Better Auth handler at `/api/auth/*`** (`app.all(...)` forwarding
  `c.req.raw`) and keep the legacy `/auth/me` + `/auth/logout` paths working
  on top of `auth.api.getSession`/`signOut`. Rationale: tasks require those
  paths to keep working; clients migrate incrementally.
- **Enable the `bearer()` plugin** so `Authorization: Bearer <session-token>`
  keeps working, and clients read the token from the `set-auth-token`
  response header after sign-in. Rationale: preserves the Bearer contract
  for web localStorage and Expo AsyncStorage without cookies.
- **`account.accountLinking: { enabled: true, trustedProviders: ["google"] }`**
  for same-email implicit linking, plus a migration setting
  `email_verified = true` for the existing user row. Rationale: v1.7 gates
  implicit linking on the local row being email-verified (default `true`);
  the existing row was imported with `email_verified = false`.
  Alternative (leave false) silently blocks the one-user migration.
- **Disabled password routes return `410 Gone`** with the JSON envelope
  (unchanged from previous draft).
- **Purge credential hashes in the same migration** (`DELETE FROM account
  WHERE provider_id = 'credential'`), after backup (unchanged).
- **Web uses `better-auth/react` `createAuthClient`** with
  `signIn.social({ provider: "google" })`; token persisted from the
  `set-auth-token` header. Rationale: no passwords typed in-browser; Bearer
  storage unchanged.
- **Expo uses `@better-auth/expo`** (system browser + deep link, token in
  SecureStore/AsyncStorage). Rationale: standard native OAuth flow; no
  passwords typed in-app. Requires installing the package (network available).
- **Live Google round-trip is verified in staging, not here**: no Google
  credentials exist in this environment. Static verification (typecheck,
  contract tests with mocked sessions, builds) lands in this change; the
  staging sign-in is a release gate.

## Risks / Trade-offs

- [Risk] Misconfigured `GOOGLE_CLIENT_ID/SECRET`, `BETTER_AUTH_SECRET`, or redirect URIs locks everyone out → Mitigation: factory fails fast with explicit missing-config error; staging checklist in runbook before cutover.
- [Risk] Email mismatch (Google email differs from stored email) creates a duplicate user → Mitigation: linking is exact-email; document that the user must use the same email; different-email behavior verified in staging.
- [Risk] Stale clients still call password endpoints → Mitigation: `410` envelope with "use Google sign-in" message; remove all first-party callers in this change.
- [Risk] Double-archive conflict with `remove-transaction-tags` on `audit-logging` → Mitigation: that change is already archived; this delta only touches the auth-events requirement and keeps data-mutations byte-identical.

## Migration Plan

1. Configure Google Cloud OAuth client (web + Expo redirect URIs) and set `GOOGLE_CLIENT_ID/SECRET`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` in all envs.
2. Deploy API with Google enabled + password endpoints disabled; run credential-purge + `email_verified` migration after backup verification.
3. User performs one Google sign-in with the same email; verify `GET /auth/me` returns the original `user.id` and customers/transactions intact.
4. Ship web + Expo Google buttons; remove password screens.
5. Rollback: re-enable `emailAndPassword` is not possible without hashes — restore `account` table from pre-cutover backup; OAuth sessions stay valid.

## Open Questions

None — remaining customer-share-page scope is a separate change.
