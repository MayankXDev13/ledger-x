# Spec Delta

## ADDED Requirements

### Requirement: Query cache clears on sign-out

Signing out of the web app SHALL clear all cached queries from the `QueryClient` so a subsequent sign-in within the same browser session never reads cached data belonging to a previous account.

#### Scenario: Sign-out clears cached server state
- **WHEN** an authenticated user triggers sign-out
- **THEN** the `QueryClient` cache is cleared before or alongside resetting local session state

### Requirement: TanStack Query lint rules are enforced

The web app ESLint configuration SHALL enable `@tanstack/eslint-plugin-query` recommended rules so unstable query keys, missing key dependencies, and invalid hook usage are caught during `lint`.

#### Scenario: Query lint plugin runs in CI and local lint
- **WHEN** `bun run lint` runs in `apps/web`
- **THEN** `@tanstack/eslint-plugin-query` rules execute against all web hooks and components with zero errors
