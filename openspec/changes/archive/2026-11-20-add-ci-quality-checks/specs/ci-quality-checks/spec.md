# Spec Delta

## Purpose

Defines automated continuous integration quality gates that validate linting, type checking, unit/contract tests, and OpenAPI specification integrity on pull requests and pushes to `main`.

## ADDED Requirements

### Requirement: CI triggers on pull requests and main pushes

The CI workflow SHALL run automatically on pull requests targeting `main`, pushes to `main`, and manual workflow dispatch. Superseded runs on the same ref or pull request SHALL be cancelled automatically.

#### Scenario: Pull request triggers CI
- **WHEN** a pull request targeting `main` is opened or updated with new commits
- **THEN** the CI workflow starts automatically and cancels any in-progress CI run for that same pull request

#### Scenario: Push to main triggers CI
- **WHEN** commits are pushed to `main`
- **THEN** the CI workflow starts automatically for the pushed commit

### Requirement: Parallel independent quality jobs

The CI workflow SHALL execute separate, parallel jobs for workspace linting, TypeScript type checking, and test execution so each gate reports an independent commit status.

#### Scenario: Lint job verifies workspaces
- **WHEN** the CI workflow runs
- **THEN** the lint job runs `bun run lint` across all workspaces defining a lint task and fails the job on any lint error

#### Scenario: Typecheck job verifies all workspaces
- **WHEN** the CI workflow runs
- **THEN** the typecheck job runs `bun run typecheck` across `apps/api`, `apps/app`, and `apps/web` and fails the job on any type error

#### Scenario: Test job runs hermetically
- **WHEN** the CI workflow runs without live database credentials or repository secrets
- **THEN** the test job runs `bun run test` across all workspaces and fails the job if any test fails

### Requirement: OpenAPI specification validation and drift check

The CI workflow SHALL run a dedicated OpenAPI check job that validates `apps/api/openapi.yaml` against OpenAPI 3.0 and verifies it matches the output generated from the API routes and Zod validators.

#### Scenario: Up-to-date OpenAPI spec passes
- **WHEN** `apps/api/openapi.yaml` is valid OpenAPI 3.0 and matches the generated document
- **THEN** the OpenAPI job passes without modifying repository files

#### Scenario: Drifted or invalid OpenAPI spec fails
- **WHEN** a route or validator changes without regenerating `apps/api/openapi.yaml`
- **THEN** the OpenAPI job exits non-zero and reports the drift

### Requirement: Reproducible and least-privilege CI execution

Each CI job SHALL pin the Bun version to match the repository `packageManager` field, install dependencies with `--frozen-lockfile`, declare read-only `contents: read` permissions, and enforce an explicit job timeout.

#### Scenario: Lockfile mismatch fails fast
- **WHEN** `package.json` dependencies diverge from `bun.lock`
- **THEN** `bun install --frozen-lockfile` exits non-zero before running checks
