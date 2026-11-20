# Proposal

## Why

The Next.js web app (`apps/web`) uses TanStack Query v5 (`@tanstack/react-query`) with centralized caching, hierarchical query keys, and cross-domain invalidation, while the Expo mobile app (`apps/app`) still fetches server data manually with `fetch`, `useState`, `useEffect`, and `useFocusEffect` across screens and hand-rolled Context providers. As a result, mobile screens duplicate network requests (for example, `customersApi.list()` is fetched independently in five places), have no shared in-memory query cache, and rely on full refetches on every screen focus. Additionally, an audit of `apps/web` surfaced three minor TanStack Query hygiene gaps: `@tanstack/eslint-plugin-query` is installed but not enabled in ESLint, several mutations do not `await` query invalidations per `web-data-fetching`, and signing out does not clear the query cache.

## What Changes

- **Add TanStack Query v5 to `apps/app`**:
  - Install `@tanstack/react-query` in `apps/app/package.json` and mount a single `QueryProvider` in `apps/app/app/_layout.tsx` wired to React Native `AppState` (`focusManager`) and `expo-network` (`onlineManager`).
  - Introduce typed domain query/mutation hooks with hierarchical query key factories mirroring `apps/web`: `useDashboard`, `useCustomers`, `useTransactions`, `useCollection`, `useStatement`, `useSettings`, `useFeatureFlags`, and `useDataPortability`.
  - Migrate mobile screens (`home`, `customers`, `ledger`, `collection`, `profile`, `customers/details`, `customers/edit`, `customers/statement`, `QuickEntryModal`, `OnboardingDialog`) off ad-hoc `fetch` / `useState` / `useEffect` calls onto the typed query hooks.
  - Keep `OfflineQueueProvider` (SQLite FIFO write queue) intact for offline-first customer and transaction creation, and integrate it with `QueryClient` so successful queue replays invalidate all affected query keys automatically.
  - Clear the mobile `QueryClient` cache on sign-out.
- **Close TanStack Query gaps in `apps/web`**:
  - Register `@tanstack/eslint-plugin-query` recommended rules in `apps/web/eslint.config.mjs`.
  - Ensure mutations in `useCustomers.ts`, `useTransactions.ts`, `useSettings.ts`, and `useDataPortability.ts` `await` invalidated query refetches before settling (while keeping optimistic cache patches in `useTransactions.ts`).
  - Clear `QueryClient` cache on `signOut()` in `apps/web/hooks/useAuth.ts`.

## Capabilities

### New Capabilities
- `mobile-data-fetching`: Defines how the Expo mobile app fetches, caches, refreshes, and mutates server state with TanStack Query alongside the SQLite offline write queue and React Native lifecycle (`AppState` / `expo-network`).

### Modified Capabilities
- `web-data-fetching`: Add requirement to clear the TanStack Query cache on sign-out and enforce query lint rules via `@tanstack/eslint-plugin-query`.

## Impact

- **Mobile (`apps/app`)**: `package.json`, `app/_layout.tsx`, new `components/providers/QueryProvider.tsx`, new domain hooks in `hooks/`, simplified `lib/settings-provider.tsx` and `lib/feature-flags-provider.tsx` (or compatibility wrappers over TanStack Query hooks), `hooks/useOfflineQueue.tsx` (cache invalidation on sync), `lib/session-provider.tsx` (cache clear on sign-out), and screens under `app/(tabs)/`, `app/customers/`, and `components/`.
- **Web (`apps/web`)**: `eslint.config.mjs`, `hooks/useAuth.ts`, `hooks/useCustomers.ts`, `hooks/useTransactions.ts`, `hooks/useSettings.ts`, `hooks/useDataPortability.ts`.
- **API (`apps/api`)**: No backend or API contract changes.
- **Dependencies**: Adds `@tanstack/react-query` (`^5.101.0`, matching `apps/web`) to `apps/app`.
