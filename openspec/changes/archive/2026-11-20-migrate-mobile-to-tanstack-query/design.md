# Design

## Context

See `proposal.md` for motivation and scope.

Current state:
- `apps/web` already runs `@tanstack/react-query@^5.101.0` with Axios (`apps/web/lib/api.ts`), `QueryProvider`, and domain hooks (`useDashboard`, `useCustomers`, `useTransactions`, `useCollection`, `useStatement`, `useSettings`, `useFeatureFlags`, `useDataPortability`). However, `@tanstack/eslint-plugin-query` is not wired into `apps/web/eslint.config.mjs`, mutations do not `await` invalidations (`useCustomers.ts`, `useTransactions.ts`, `useSettings.ts`, `useDataPortability.ts`), and `useAuth.ts` does not clear `QueryClient` on `signOut()`.
- `apps/app` (Expo SDK 58 / React Native 0.88) has no query cache library. It uses a native `fetch` wrapper (`apps/app/lib/api.ts`), four root Context providers (`SessionProvider`, `SettingsProvider`, `FeatureFlagsProvider`, `OfflineQueueProvider`), and screen-level `useState` + `useEffect` / `useFocusEffect`.
- `apps/app` also owns a critical SQLite-backed FIFO `OfflineQueueProvider` (`apps/app/hooks/useOfflineQueue.tsx` + `apps/app/lib/offline-queue.ts`) that guarantees offline capture, idempotent client-UUID replay, and pending overlays on Home, Customers, Ledger, and Collection screens.

## Goals / Non-Goals

**Goals:**
- Standardize `apps/app` on `@tanstack/react-query` v5 (`^5.101.0`, matching `apps/web`) with a single `QueryProvider` integrated with React Native `AppState` and `expo-network`.
- Mirror `apps/web`'s hierarchical query key conventions in `apps/app/hooks/` so both clients follow one mental model.
- Preserve all `offline-write-queue` guarantees (SQLite persistence, idempotent client-UUID replay, pending UI overlays, failed-item review) and bridge replay completion into `QueryClient` invalidation.
- Close the three `apps/web` TanStack Query hygiene gaps without regressing optimistic transaction updates.

**Non-Goals:**
- Persisting the entire TanStack Query read cache to AsyncStorage/SQLite (`@tanstack/react-query-persist-client`) in this change; in-memory caching during a session already satisfies `offline-write-queue`'s "MAY display cached reads while offline" requirement.
- Replacing `OfflineQueueProvider` with TanStack Query's built-in `paused` mutations (the SQLite FIFO queue with per-customer ordering, client-UUID deduplication, and failed-item review UI is already tested and specified in `offline-write-queue`).
- Extracting a shared `packages/query` monorepo package (web uses Axios + Next.js client hooks + Sonner toasts; mobile uses native `fetch` + React Native alerts/banners + `OfflineQueueProvider`).
- Changing any `apps/api` endpoints or response shapes.

## Decisions

### 1. Mobile `QueryProvider` placement and React Native lifecycle wiring
- **Decision**: Mount `QueryProvider` in `apps/app/app/_layout.tsx` above `SessionProvider`, `SettingsProvider`, `FeatureFlagsProvider`, and `OfflineQueueProvider` so all providers and screens can access `useQueryClient()`.
- **Lifecycle wiring**:
  - `focusManager.setEventListener`: subscribe to `AppState.addEventListener("change", (status) => onFocus(status === "active"))` (guarded for non-web platforms).
  - `onlineManager.setEventListener`: subscribe to `expo-network` (`Network.addNetworkStateListener` if available in SDK 58, plus initial `Network.getNetworkStateAsync()` and refresh on `AppState` active).
  - Default `QueryClient` options: `staleTime: 60_000`, `gcTime: 300_000`, `retry: 1`, `networkMode: "offlineFirst"` for queries so cached reads stay usable offline while still refetching on reconnect.
- **Screen focus refresh**: Provide a small `useRefreshOnFocus(refetch)` helper (standard TanStack Query React Native pattern using `useFocusEffect` + ref skipping initial mount) for screens that expect fresh numbers when navigating back (e.g., Home, Customers, Ledger, Collection, Customer Details).
- **Alternatives considered**: Keeping `QueryProvider` inside `SessionProvider`. Rejected because `SessionProvider.signOut` needs `useQueryClient().clear()` cleanly.

### 2. Preserve `OfflineQueueProvider` and bridge replay to `QueryClient`
- **Decision**: Keep `OfflineQueueProvider` and `lib/offline-queue.ts` as the sole owner of offline customer/transaction creation and SQLite replay. Inside `OfflineQueueProvider`, call `useQueryClient()` and, whenever `sync()` replays `> 0` accepted items (or `queueCustomer`/`queueTransaction` immediately syncs online), invalidate `dashboardKeys.all`, `customerKeys.all`, `transactionKeys.all`, `collectionKeys.all`, and `statementKeys.all`.
- **Rationale**: Preserves all existing `queue-core.test.ts` and `queue-single-replay.test.ts` guarantees while automatically updating every screen after sync without manual pull-to-refresh.
- **Alternatives considered**: Replacing SQLite queue with TanStack Query `MutationCache` persistence. Rejected as high-risk rewrite with no user-facing benefit over the tested SQLite FIFO queue.

### 3. Back `SettingsProvider` and `FeatureFlagsProvider` with TanStack Query
- **Decision**: Keep the exported `useSettings` / `useSharedSettings` and `useFeatureFlags` hook contracts stable so screens don't break, but back them internally with `useQuery` / `useMutation` (or replace the context state with TanStack Query hooks directly, removing redundant `useState` + `setInterval` boilerplate).
- **Rationale**: `FeatureFlagsProvider`'s manual `setInterval(60_000)` + `AppState` listener is natively handled by `useQuery({ refetchInterval: 60_000, refetchOnWindowFocus: true })` once `focusManager` is wired.

### 4. Mobile Pagination on Customer Details (`useInfiniteQuery`)
- **Decision**: Migrate `apps/app/app/customers/details.tsx`'s manual `page` / `hasMore` / array-concatenation state to `useInfiniteQuery` (`useInfiniteCustomerTransactions`), mirroring `apps/web/hooks/useTransactions.ts`.
- **Rationale**: Eliminates stale-page merge bugs and makes transaction edit/delete invalidation refresh all loaded pages cleanly.

### 5. Web `apps/web` Fixes
- **ESLint plugin**: Import `pluginQuery` from `@tanstack/eslint-plugin-query` in `apps/web/eslint.config.mjs` and spread `...pluginQuery.configs["flat/recommended"]`. Fix any lint warnings/errors surfaced.
- **Awaited invalidations**: In `useCustomers.ts`, `useTransactions.ts`, `useSettings.ts`, and `useDataPortability.ts`, make `onSuccess` `async` and `await Promise.all([...])` on `qc.invalidateQueries(...)` so mutations settle only after refetches complete (matching `web-data-fetching/spec.md`). Keep the synchronous `qc.setQueryData` / `qc.setQueriesData` patches in `useTransactions.ts` *before* the `await Promise.all(...)` so UI updates remain instant.
- **Sign-out cache clear**: In `apps/web/hooks/useAuth.ts`, call `useQueryClient()` and `queryClient.clear()` inside `signOut()`.

## Risks / Trade-offs

- **[Risk] Double-refetch on screen mount + `useFocusEffect`** → Mitigation: `useRefreshOnFocus` uses a `firstTimeRef` guard so it skips the initial mount (handled by `useQuery`) and only triggers on subsequent focus returns when queries are stale.
- **[Risk] `apps/app` tests mocking `@/lib/api` or rendering without `QueryProvider`** → Mitigation: Check all existing `apps/app/**/*.test.ts(x)` files during implementation; unit tests on pure modules (`lib/*.test.ts`) are unaffected, and any hook/component tests wrap with a fresh test `QueryClientProvider`.
- **[Risk] `apps/web` `await qc.invalidateQueries(...)` keeping submit buttons in `isPending` slightly longer** → Mitigation: In `useTransactions.ts`, synchronous cache patching already updates the list immediately, and `invalidateQueries` runs in parallel via `Promise.all` (only active queries refetch).
- **[Risk] `@tanstack/eslint-plugin-query` flagging existing web hooks** → Mitigation: Run `bun run lint` in `apps/web` immediately after enabling the plugin and resolve any reported issues in the same change.
