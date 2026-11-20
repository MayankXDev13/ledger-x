# Tasks

## 1. Mobile TanStack Query Setup & Lifecycle

- [x] 1.1 Add `@tanstack/react-query@^5.101.0` to `apps/app/package.json` and run `bun install`; verify clean resolution and zero peer-dependency errors in `bun.lock`.
- [x] 1.2 Create `apps/app/components/providers/QueryProvider.tsx` with a single `QueryClient` (`staleTime: 60_000`, `gcTime: 300_000`, `retry: 1`, `networkMode: "offlineFirst"`), wire `focusManager` to React Native `AppState` and `onlineManager` to `expo-network`, and add a `useRefreshOnFocus` helper in `apps/app/hooks/useRefreshOnFocus.ts`; verify `bun run --cwd apps/app typecheck` passes.
- [x] 1.3 Mount `QueryProvider` in `apps/app/app/_layout.tsx` above `SessionProvider`, `SettingsProvider`, `FeatureFlagsProvider`, and `OfflineQueueProvider`, and update `apps/app/lib/session-provider.tsx` to call `queryClient.clear()` on sign-out; verify `bun run --cwd apps/app typecheck` passes.

## 2. Mobile Domain Query & Mutation Hooks

- [x] 2.1 Create hierarchical query key factories and hooks for dashboard (`apps/app/hooks/useDashboard.ts`), customers (`apps/app/hooks/useCustomers.ts`), transactions (`apps/app/hooks/useTransactions.ts`, including `useInfiniteCustomerTransactions`), collection (`apps/app/hooks/useCollection.ts`), statements (`apps/app/hooks/useStatement.ts`), and data portability (`apps/app/hooks/useDataPortability.ts`), plus unit tests for key factory shapes; verify `bun run --cwd apps/app test` and `typecheck` pass.
- [x] 2.2 Refactor `apps/app/lib/settings-provider.tsx` (and `apps/app/hooks/useSettings.ts`) and `apps/app/lib/feature-flags-provider.tsx` to use TanStack Query (`useQuery` / `useMutation`) while preserving their exported hook interfaces (`useSettings`, `useSharedSettings`, `useFeatureFlags`), and remove unused manual `useInsights.ts` once replaced; verify `bun run --cwd apps/app typecheck` and `test` pass.
- [x] 2.3 Bridge `apps/app/hooks/useOfflineQueue.tsx` with `useQueryClient()` so successful queue syncs and online submissions invalidate `dashboardKeys.all`, `customerKeys.all`, `transactionKeys.all`, `collectionKeys.all`, and `statementKeys.all`; verify existing queue tests (`queue-core.test.ts`, `queue-single-replay.test.ts`) pass.

## 3. Mobile Screen & Component Migration

- [x] 3.1 Migrate tab screens `apps/app/app/(tabs)/home.tsx`, `customers.tsx`, `ledger.tsx`, `collection.tsx`, and `profile.tsx` from direct `@/lib/api` calls and manual `useState`/`useEffect` fetching to the new TanStack Query hooks with `useRefreshOnFocus` and pull-to-refresh `refetch()`; verify `bun run --cwd apps/app typecheck` passes and offline pending overlays still render.
- [x] 3.2 Migrate detail/modal screens `apps/app/app/customers/details.tsx` (using `useInfiniteCustomerTransactions` + update/delete transaction mutations), `apps/app/app/customers/edit.tsx`, `apps/app/app/customers/statement.tsx`, `apps/app/components/QuickEntryModal.tsx`, and `apps/app/components/OnboardingDialog.tsx` to TanStack Query hooks; verify zero direct read calls to `@/lib/api` remain in `apps/app/app/` and `apps/app/components/` and `bun run --cwd apps/app typecheck` and `lint` pass.

## 4. Web TanStack Query Hygiene Fixes

- [x] 4.1 Enable `@tanstack/eslint-plugin-query` (`flat/recommended`) in `apps/web/eslint.config.mjs` and resolve any flagged issues; verify `bun run --cwd apps/web lint` passes with zero errors.
- [x] 4.2 Update `apps/web/hooks/useCustomers.ts`, `useTransactions.ts`, `useSettings.ts`, and `useDataPortability.ts` so mutation `onSuccess` handlers `await Promise.all(...)` on `qc.invalidateQueries(...)` (preserving synchronous `setQueryData`/`setQueriesData` patches in `useTransactions.ts`); verify `bun run --cwd apps/web test` and `typecheck` pass.
- [x] 4.3 Update `apps/web/hooks/useAuth.ts` so `signOut()` calls `queryClient.clear()` to purge cached server data on account logout; verify `bun run --cwd apps/web typecheck` and `test` pass.

## 5. Cross-App Verification

- [x] 5.1 Run full workspace validation (`bun run typecheck`, `bun run lint`, `bun run test`) across `apps/web` and `apps/app` and confirm all checks pass with zero regressions.
