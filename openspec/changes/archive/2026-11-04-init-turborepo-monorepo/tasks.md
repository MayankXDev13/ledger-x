# Tasks

## 1. Root scaffold (bun + Turborepo)

- [x] 1.1 Create root `package.json` (name `ledger-x`, private, `workspaces: ["apps/*"]`, `engines` pinning bun, devDependency `turbo`, root scripts `dev`/`build`/`lint`/`typecheck` delegating to `turbo run`) and verify `bun install` at root succeeds and generates the root `bun.lock`
- [x] 1.2 Create `turbo.json` v2 with `dev` (persistent), `build` (depends on `^build`, declared outputs), `lint`, and `typecheck` (depends on `^typecheck`); verify `bunx turbo run build --dry=json` exits 0 with the task graph parsed
- [x] 1.3 Add root `.gitignore` entries for bun/gitignored runtime secrets (`apps/api/.dev.vars`, `apps/*/.env*`); verify `git check-ignore apps/api/.dev.vars` and `git check-ignore apps/web/.env.local` both report ignored

## 2. Mobile workspace (`apps/app`)

- [x] 2.1 Move the Expo app with `git mv app apps/app`, rename its package to `@ledger-x/app`, and verify with `git ls-files` that no top-level `app/` paths remain while `apps/app/**` carries all prior files (configs, `bun.lock` removed in favor of the root lock)
- [x] 2.2 Run `bun install` from root and verify `apps/app` deps resolve; then verify `bun main` health by running the workspace's own `typecheck` and `lint` scripts and `bunx expo config --json` exits 0 from `apps/app`

## 3. API workspace (`apps/api`)

- [x] 3.1 Author `apps/api/package.json` (`@ledger-x/api`; scripts `dev`, `deploy`, `build` (`wrangler deploy --dry-run`), `typecheck`, `db:generate`/`db:migrate`/`db:studio`, `cf-typegen`) and `apps/api/tsconfig.json` (Workers types, bundler module resolution, hono jsx) reusing old `server/` dependency majors; verify `bun install` resolves
- [x] 3.2 Restore sources from git history via `git show HEAD:<path>` into `apps/api`: `src/index.ts`, `src/routes/*`, `src/middleware/*`, `src/db/*`, `src/lib/*`, `src/types/*`, `src/validators.ts`, the full `drizzle/` directory, and `openapi.json`; verify the restored file list matches `git ls-tree -r --name-only HEAD server/src server/drizzle`
- [x] 3.3 Author clean `apps/api/wrangler.jsonc` (worker name `server-v2`, `main`, `compatibility_*`, Hyperdrive binding and custom-domain route preserved; **no** credentials in `vars`) plus `apps/api/.dev.vars.example` documenting required keys; verify committed wrangler config contains no connection string or password (grep) and `git check-ignore apps/api/.dev.vars` passes
- [x] 3.4 Verify `bun run typecheck` and `bun run build` pass inside `apps/api`; any fixes made here must be config/dependency-only, never altering restored logic

## 4. Web workspace (`apps/web`)

- [x] 4.1 Author `apps/web/package.json` (`@ledger-x/web`; scripts `dev`, `build`, `lint`, `typecheck`), `tsconfig.json`, `next.config.ts`, `postcss.config.mjs`, `eslint.config.mjs`, and `components.json` from the old `web/` configs, adding the base URL env for the API; verify `bun install` resolves
- [x] 4.2 Restore sources from git history via `git show HEAD:<path>` into `apps/web`: `app/**` (auth, dashboard, customers, tags, profile pages and layouts), `components/**`, `hooks/**`, `lib/**`, `public/**`, and `favicon.ico`; verify the restored file list matches `git ls-tree -r --name-only HEAD web/app web/components web/hooks web/lib web/public`
- [x] 4.3 Add `apps/web/.env.local.example` with placeholders for Supabase URL/anon key and API base URL; verify the documented variable names match the usage in restored `lib/supabase.ts` and `lib/api.ts`
- [x] 4.4 Verify `bun run typecheck` and `bun run build` pass inside `apps/web`; any fixes made here must be config/dependency-only, never altering restored logic

## 5. Root integration checks

- [x] 5.1 Verify from the root: `bun run typecheck`, `bun run lint`, and `bun run build` all succeed across `apps/app` (typecheck/lint), `apps/web`, and `apps/api` via turbo
- [x] 5.2 Verify `bun run dev` starts web and api dev servers together; curl a public route on the API local port and the web local port for non-error responses, then stop both
- [x] 5.3 Verify no pnpm remnants (`rg --files -g 'pnpm-lock.yaml' -g 'pnpm-workspace.yaml'` is empty) and exactly one root `bun.lock` exists
- [x] 5.4 Update the root `README.md` with the monorepo quick start (bun install, bun dev, per-workspace commands, secrets setup via `.dev.vars.example`); verify every non-interactive command in it runs as documented

## Workflow follow-up

- Archive the change after the project's review requirements are satisfied.
- Verify the archived result.
- Rotate the Supabase database password exposed in git history (outside this change's scope, flagged in design.md).
