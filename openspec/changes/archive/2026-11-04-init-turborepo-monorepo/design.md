# Design

## Context

See proposal.md - Why. Current facts that shape the approach:

- `app/` (Expo 54, RN 0.81, expo-router, nativewind, bun.lock, package name `ledger-x`) is the only living app on disk; it already runs under bun.
- Git history (HEAD `b29d464`) holds the deleted `web/` (Next.js 16.2.9, React 19, Tailwind v4, radix/shadcn UI, TanStack Query, axios, supabase-js) and `server/` (Hono 4, Drizzle + `pg`, Supabase Postgres reached via Cloudflare Hyperdrive, wrangler, worker name `server-v2`, routes: auth / customers / transactions / dashboard behind auth middleware, committed Drizzle migrations, `openapi.json`).
- HEAD `server/wrangler.jsonc` contains a live Supabase pooler connection string with password in `vars` - this must not be recommitted, and its credential is exposed in history.
- `openspec/` root uses the spec-driven schema; this change's planning artifacts live at `openspec/changes/init-turborepo-monorepo/`.

## Goals / Non-Goals

**Goals:**

- One root install: bun workspaces + `turbo.json` task graph (`dev`, `build`, `lint`, `typecheck`).
- Restore `web` and `api` as workspaces with fresh configs and selectively-restored feature code from git history.
- Secrets hygiene: no credentials in committed files; `.dev.vars` gitignored.
- Mobile app keeps working from its new home (`apps/app`) with unchanged scripts.

**Non-Goals:**

- No new product features; no changes to API routes, validation, or DB schema (behavior parity with restored code).
- No CI/CD pipeline setup, no Vercel deployment config changes.
- No git-history rewrite of the leaked credential (rotation is recommended separately).
- No shared library extraction (`packages/*`) until duplication actually appears.
- No React Native for mobile beyond moving it; no Expo SDK upgrade.

## Decisions

1. **Bun workspaces + Turborepo (turbo ^2) over pnpm or migration-less status quo.** User-selected package manager; bun already manages the mobile app, so a single root `bun.lock` unifies all three ecosystems. Turborepo gives task graph + caching; `turbo.json` uses the v2 single-package-less "workspace" layout with `apps/*` glob. Alternative (keep three separate folders/PMs) rejected: it is exactly the problem.

2. **Workspace layout and names.** Root package `ledger-x` (private). Workspaces (bun `workspaces: ["apps/*"]`):
   - `apps/app` - package `@ledger-x/app` (Expo; entry, scripts, eas/metro/babel config unchanged except relative paths that don't exist - they are all CWD-relative already).
   - `apps/web` - package `@ledger-x/web` (Next.js).
   - `apps/api` - package `@ledger-x/api` (Hono on Workers; wrangler worker name stays `server-v2` so DNS/deploy history is not invalidated).
   Root `devDependencies`: `turbo`. `engines` pin a bun major and node range.

3. **Task pipeline.** Each workspace declares the scripts it can honestly support; root `turbo.json` maps them:
   - `web`: `dev` (`next dev`), `build` (`next build`), `lint`, `typecheck` (`tsc --noEmit`).
   - `api`: `dev` (`wrangler dev` with `.dev.vars`), `build` (`wrangler deploy --dry-run` - Workers have no real build artifact; dry-run validates bundling), `deploy`, `typecheck`, `db:generate`/`db:migrate` (drizzle-kit), `cf-typegen`. `build` depends on `typecheck` (`^typecheck` inputs).
   - `app`: `start`, `android`, `ios`, `lint`, `typecheck`, `build:apk` (left out of turbo; device builds run per-app).
   Root scripts: `dev`, `build`, `lint`, `typecheck` all delegate to `turbo run <task>`.
   Mobile app's `build:apk` is intentionally NOT folded into turbo (EAS/device tooling is slow, interactive, rarely needed); alternative of a turbo `build:apk` task rejected for noise.

4. **Selective restore mechanics.** Fresh `package.json`/`tsconfig.json` authored per workspace (server tsconfig targets Workers bundler module resolution; web tsconfig from Next defaults). Source files restored verbatim per file via `git show HEAD:<path> > apps/<target>/<path>`:
   - api: `src/{index.ts,routes/*,middleware/*,db/*,lib/supabase.ts,types/hono.ts,validators.ts}`, `drizzle/` (sql + meta snapshots), `wrangler.jsonc` (rebuilt clean), `openapi.json`.
   - web: `app/**` (pages/layouts), `components/**`, `hooks/**`, `lib/**`, `public/**`, configs (`next.config.ts`, `postcss.config.mjs`, `eslint.config.mjs`, `components.json`, root layout favicon).
   Everything under `web/.agents`, `web/.commandcode`, and vendored skill/lock files are NOT restored.
   Dependency strategy: reuse old manifests' major versions, install with bun; adjust names on version mismatch rather than pinning old patches. Platform-specific wrangler bits (`hyperdrive` binding id, `routes`) come from the old config minus secrets.

5. **Secrets handling.** `apps/api/.dev.vars` for local runtime secrets (gitignored at root `.gitignore`), `apps/api/.dev.vars.example` documents required keys without values. Wrangler `vars` keeps only non-sensitive values; production secrets via `wrangler secret put`. Same rule for web: supabase URL/anon key and API base URL in untracked `.env.local`. rationale: the old leak; alternative of keeping vars (operator convenience) rejected on secret-safety.

6. **CORS origin.** Old API hardcoded `http://localhost:3000`. Restore behavior-identical for dev by defaulting to localhost:3000 but read the origin from a (non-secret) env var so web deploys don't require api code changes. Record: default matches old behavior, so no behavior change for existing setups.

## Risks / Trade-offs

- [Deletion of `app/`, `web/`, `server/` paths breaks muscle memory and any scripts/CI referencing them] -> Root README quick-start with new commands; old paths remain recoverable via git.
- [bun + heterogeneous ecosystems (expo/next/workers)] -> All three officially support bun; pin managers via `engines` and document bun >= 1.1; gate with the typecheck/lint/build pipeline before declaring done.
- [Restored code may need import-path or dependency-version adjustments after regeneration] -> typecheck/lint/build gate; fixes are config-only and in-place under `apps/*` - restored logic is never edited.
- [Single lockfile churn couples release cadence] -> acceptable; turbo caching keeps builds fast.
- [Leaked credential in git history can't be fixed here] -> rotate the Supabase DB password post-restore; explicitly out of scope of this change.
- [Workers dry-run as `api build`] -> keeps `turbo run build` uniform; true verification is `wrangler dev` (spec scenario covers dev server).

## Migration Plan

1. Scaffold root: `package.json` (bun workspaces), `turbo.json`, `.gitignore` additions (`.dev.vars`, `apps/*/.env*`), root `bun.lock` regenerated on first `bun install`.
2. `git mv app apps/app`, rename package to `@ledger-x/app`, verify `bun install` resolves and `expo start` still boots from `apps/app`.
3. Recreate `apps/api` + `apps/web` manifests, restore sources from HEAD as in Decisions 4, install.
4. Author clean `wrangler.jsonc` (no secrets) + `.dev.vars.example`.
5. Run `bun run typecheck && bun run lint && bun run build` from root; fix residual config issues only (never alter restored logic expectations).
6. Smoke-test `turbo dev` (web + api up; api answers a public route).
7. Deploy parity check is manual and optional (requires `wrangler` login); not part of acceptance.
   **Rollback**: everything lands in one commit; `git revert` restores the three-path layout. Deleted-file contents remain in HEAD until then.

## Open Questions

None. (Assumptions recorded under Decisions: web/api package names under `@ledger-x/*`, worker name `server-v2` preserved, openapi.json restored as-is.)
