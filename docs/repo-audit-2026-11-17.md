# Ledger-X repository audit — 2026-11-17

Point-in-time audit of the whole monorepo: docs, code, tests and delivery
pipeline. Board with diagrams: <https://jojopen.com/mayanknair/ledger-x/ledger-x-audit-nov-2026-bu33fp2d>

## Verdict

Healthy, unusually well-documented codebase with strong domain modelling and a
real test suite. The weak points are **delivery** (nothing enforces the checks the
docs promise) and **deployment documentation drift** (README still describes the
pre-Neon, pre-Google-auth Supabase setup). No secrets are committed and no
destructive or blocking defects were found.

| Area | Rating | Note |
| --- | --- | --- |
| Domain model & data integrity | Strong | Soft delete, sample-data exclusion, audit log, idempotent writes |
| API contract | Strong | Zod → OpenAPI with a committed-drift check |
| Auth | Adequate | Google-only Better Auth; token handling is the main risk |
| Mobile offline behaviour | Strong | FIFO SQLite queue, exactly-once replay, visible failures |
| Tests | Strong locally | 335 passing; no CI execution, no DB integration tests |
| CI/CD | Weak | Only an Android APK workflow exists |
| Documentation | Strong but drifting | 21 docs; some are living contracts, some are dated reports |
| Security posture | Adequate | CORS allowlist and secret hygiene good; no rate limit, CSP or header policy |

## What was checked

```bash
bun test         # apps/api 194 pass · apps/web 50 pass · apps/app 91 pass  (335 total)
git ls-files     # no .env / .dev.vars tracked; only *.example files
```

Also reviewed: `README.md`, all 21 files in `docs/`, `openspec/specs` (25 specs,
no active changes), `apps/api/src` (routes, middleware, schema, validators),
`apps/{web,app}` structure, `wrangler.jsonc`, `next.config.ts`, and
`.github/workflows`.

## Findings

### P1 — fix before the next production deploy

**1. No CI runs lint, typecheck, tests or the OpenAPI drift check.**
`.github/workflows/` contains only `android-apk.yml`, and it triggers on
`apps/app/**` paths. `README.md` and `docs/api-specification.md` state that
`bun run test` runs `openapi:check` so a stale contract "fails the build" — true
locally, false in CI. A PR can merge with a stale `openapi.yaml`, a type error or
a failing test as long as it does not touch the mobile app.
*Fix:* one `ci.yml` on `pull_request` running `bun install --frozen-lockfile`,
`bun run lint`, `bun run typecheck`, `bun run test` and `bun run check:visual`.

**2. README deployment instructions describe a stack the repo no longer uses.**
- `README.md:43` — "Supabase Postgres via Hyperdrive"; the database is Neon
  (`docs/cloudflare-deploy.md`, `apps/api/wrangler.jsonc`).
- `README.md:60` — says `apps/web` requires `NEXT_PUBLIC_SUPABASE_URL` and
  `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`; `apps/web/.env.local.example` only
  defines `NEXT_PUBLIC_API_URL`, and no `@supabase` import remains in `apps/web`.
- `README.md:145` — tells operators to `wrangler secret put` Supabase values;
  the required secrets are `BETTER_AUTH_SECRET`, `GOOGLE_CLIENT_ID` and
  `GOOGLE_CLIENT_SECRET` (`docs/auth-migration.md`).
- `README.md:140` — references `api.ledgex.mayankxdev.shop`; the custom domain is
  commented out in `wrangler.jsonc` and the live origin is the `workers.dev` one.

*Impact:* a new contributor or a rebuild-from-scratch deployment follows steps
that fail silently (unused vars) or fail outright (wrong origin/secret names).

**3. Session bearer token lives in `localStorage` and travels in a URL fragment.**
`apps/web/lib/auth.ts:27-33` persists the token in `localStorage`;
`apps/api/src/app.ts` appends it to the OAuth redirect as `#token=…` because the
session cookie is cross-site. Any XSS on the web origin, or a copied/shared URL
that still carries the fragment, yields a long-lived credential, and the static
export has no CSP to reduce that blast radius.
*Fix:* adopt an HttpOnly cookie on a shared parent domain, or shorten token TTL
and add a CSP `_headers` file for Pages.

### P2 — next iteration

**4. No rate limiting anywhere in the API.** No hits for rate-limit middleware in
`apps/api/src`. Publicly reachable writes (`POST /customers`, `/transactions`) and
the session lookup on every authenticated request are unmetered.

**5. No security-header policy on the web app.** The web build is a static export
(`apps/web/next.config.ts`); Pages supports a `_headers` file for CSP, HSTS,
`X-Content-Type-Options` and `Referrer-Policy`, none of which are configured.

**6. Dependency majors have split.** API is on `zod@4`, web/mobile on `zod@3`;
web is on React 19.2.4, mobile on 19.3.0; TypeScript 5 on web, 6 elsewhere. Shared
validation or shared UI types between web and mobile will be blocked until this is
reconciled.

**7. Living docs and historical reports are mixed together.** `docs/ui-ux-audit.md`
(507 lines), `docs/ui-ux-verification.md` and
`docs/ui-ux-audit-discrepancies.md` are dated snapshots that read like current
contracts. They are indexed in the README alongside live specs such as
`docs/books.md`. There is no `status:`/`last-verified:` header convention, so
readers cannot tell which statements are still enforced.

**8. Device-level verification is still open.** `docs/ui-ux-audit-discrepancies.md`
records task 8.6 (launch screen and all five tabs captured on iOS and Android) as
unfinished. The token, contrast and colour scripts cover a lot, but a real-device
visual and interaction pass after the dark-theme overhaul has not happened.

**9. No database-level tests.** `apps/api/src/test` uses the injected `withDb`
harness, which is the right design for fast tests, but nothing exercises the
Drizzle migrations against a real Postgres. `drizzle/0001…0007` are only proven
by having been applied during the cutover.

### P3 — polish

- **Two env conventions:** the API reads `apps/api/.dev.vars`, while
  `db:feature-flag` and `db:migrate:neon` read the repository-root `.env`
  (`docs/feature-flags.md`). Document the split or unify it.
- **Observability:** Workers logs are enabled, but errors are only
  `console.error`d (`apps/api/src/app.ts`); no request ID or structured fields,
  so correlating a user report with a log line is manual.
- **Route size:** `apps/api/src/routes/transactions.ts` (324 lines) and
  `customers.ts` (245 lines) mix validation, persistence and response shaping.
  Extracting the query layer would make them easier to test in isolation.
- `docs/api-specification.md` is accurate and the generated contract is
  committed — keep it that way once CI enforces `openapi:check`.

## What is genuinely good

- **Contract-driven API.** Routes, Zod validators and the committed OpenAPI file
  share one definition, with metadata cross-checked both ways.
- **Idempotent writes.** Client-supplied UUIDs make offline replay safe; there is
  a dedicated test (`idempotency.test.ts`).
- **Offline queue.** Strict FIFO, transient-vs-permanent failure classification,
  never silently dropped, restart-persistent.
- **Server-enforced feature flags.** Disabled features disappear from navigation,
  return `404`/`403`, and cannot be written by a user.
- **Data portability.** Soft delete, sample rows excluded from exports, JSON
  archive, self-serve deletion with audit retention.
- **Visual quality gates.** `check:tokens`, `check:contrast`, `check:colors` and
  `check:visual-tokens` encode the design system as executable checks.
- **Secret hygiene.** `.env*` and `.dev.vars*` are ignored; only examples are
  tracked.

## Recommended sequence

1. Add the `ci.yml` quality gate (P1-1). This makes every later change verifiable.
2. Rewrite the README deployment section against the current Neon + Better Auth
   reality (P1-2).
3. Decide the token transport (P1-3) and add a Pages `_headers` policy (P2-5).
4. Add rate limiting to auth and write routes (P2-4).
5. Unify Zod majors before building any shared validation package (P2-6).
6. Add a `status:` header convention to `docs/` and move dated audits to
   `docs/audits/` (P2-7).
7. Schedule the device screenshot pass (P2-8) and add a Postgres smoke test for
   migrations (P2-9).
