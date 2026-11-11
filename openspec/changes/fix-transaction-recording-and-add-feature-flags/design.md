# Design

## Context

Two independent problems share one change because the user reported them together and both touch the same screens.

**The ledger unit is whole rupees, and the clients disagree with the API about it.** `transactions.amount` is an `integer` column (`apps/api/src/db/schema.ts:232`) and the API validates it as one (`apps/api/src/validators.ts:19`, `z.number().int()`). The rest of the system treats the stored number as whole rupees: exports format it as major units (`apps/api/src/lib/csv.ts:7-9`, `formatAmount(1250) → "1250.00"`), the web formatter drops fraction digits because "the ledger stores whole rupees" (`apps/web/lib/format.ts:5-11`), and the docs say the same (`docs/upi-collection.md:34`, `docs/data-portability.md:5`). But both clients accept decimals — the web schema allows any value ≥ 0.01 (`apps/web/lib/validation.ts:12-14`) and the mobile screens parse with `parseFloat` (`apps/app/app/ledger/add.tsx:46`, `apps/app/components/QuickEntryModal.tsx:93`, `apps/app/components/EditTransactionModal.tsx:57`). The API rejects those writes with `400`; the web client shows only the envelope's generic `error` string (`apps/web/hooks/useTransactions.ts:50`) because `toApiError` captures `details` but nothing renders it (`apps/web/lib/api-error.ts`), and the mobile client reports success because the queue never rethrows an executor failure (`apps/app/lib/offline-queue.ts:193-212`).

**Freshness is polling-driven on web and mount-driven on mobile.** Web transaction mutations invalidate four key groups but not the customer domain (`apps/web/hooks/useTransactions.ts:44-47`), and they resolve without awaiting the refetch, so the list under the dialog can still be stale when it closes. The dashboard polls every 30 s (`apps/web/hooks/useDashboard.ts:17,25,33`) and `refetchOnWindowFocus` is off globally (`apps/web/components/providers/QueryProvider.tsx:16`), so a write made on another device waits for the poll. On mobile the customer detail screen fetches only on mount — it has no `useFocusEffect`, unlike the Home, Ledger and Customers tabs (`apps/app/app/customers/details.tsx:86-88`) — and the collection screen has neither a focus effect nor a merge of queued entries for existing customers (`apps/app/app/(tabs)/collection.tsx:193-213`, `apps/app/hooks/useInsights.ts:9-30`). The optimistic merge drops a queue item the moment it flips to `synced` (`apps/app/lib/queue-core.ts:147-161`), so a queued credit disappears from the list before the server list replaces it. Separately, `queueTransaction` stores a payload without an `id` even though `execute` casts one in (`apps/app/hooks/useOfflineQueue.tsx:52-61,164-170`), so the server never receives the client-generated identifier and its idempotency branch (`apps/api/src/routes/transactions.ts:195-208`) is dead code — contradicting `docs/offline-queue.md` and the `offline-write-queue` requirement that each queued write carry a deduplicating identifier.

**There is no flag mechanism of any kind.** No flags module, no per-feature column (`user_settings` holds `upi_id`, `payee_name` and two onboarding timestamps — `apps/api/src/db/schema.ts:147-157`), and no environment variable gates a feature (`apps/api/wrangler.jsonc` vars are CORS and auth configuration only). The Collection destination is reachable from the web sidebar (`apps/web/components/AppSidebar.tsx:56-58`), the web mobile-bottom-nav (`apps/web/components/MobileBottomNav.tsx:28`) and the mobile tab bar; the UPI configuration lives in the web Settings page (`apps/web/app/(app)/settings/page.tsx:156-240`) and the mobile Profile screen (`apps/app/app/(tabs)/profile.tsx:265-317`).

**Constraints.** The API is Hono on Cloudflare Workers with Drizzle over Neon/Supabase Postgres through Hyperdrive; it carries an OpenAPI 3.0 contract with a drift check wired into `apps/api`'s test script (`bun run openapi:check`). The mobile app is Expo Router; its bottom bar is expo-router's `<Tabs>` (`apps/app/app/(tabs)/_layout.tsx`), not a hand-rolled bar. Both clients already centralise server state (TanStack Query on web, `SettingsProvider` + `useOfflineQueue` on mobile), so both flag state and queue state have a natural home.

## Goals / Non-Goals

**Goals:**
- A transaction write either succeeds and is visible at once, or fails with a message the user can act on.
- The amount contract is stated in one unit, enforced before a write leaves the device, and named in the API's error.
- A recorded transaction is visible on the dashboard and on the customer page without waiting for a poll or a pull-to-refresh.
- The administrator can switch a shipped feature off for the deployment, at run time, without a client release and without a user being able to undo it.
- A disabled feature is unavailable end to end — no nav entry, no screen, no route.

**Non-Goals:**
- Changing the ledger's storage unit or migrating stored amounts. The integer-rupee column stays; no amount is rewritten.
- Adding paise support, a new payment method, or any other payment feature.
- Removing the Collection or UPI features, or adding a user-facing switch that can enable a disabled feature.
- Introducing an admin identity, an admin role, or an admin API with its own credential.
- Reworking the offline queue's storage, retry backoff, or the app-lock and onboarding behaviour.

## Decisions

### The ledger keeps whole rupees; the API contract is unchanged

The `integer` column plus the exports, the formatter, the UPI intent builder and the docs all agree that the stored number is whole rupees, so the only thing wrong is that the clients accept a value the API will refuse. Changing the column to `numeric` and storing paise would multiply every stored amount by 100, and would have to be carried through every formatter, the FIFO aging maths, the exports, the statement model, the UPI intent builder and the OpenAPI contract — for a UI that renders `maximumFractionDigits: 0` and therefore cannot show paise anyway. So the column, the validator and the storage format stay, the clients are corrected to match, the misleading `// Store amount in paise/cents` comment at `apps/api/src/db/schema.ts:231` is corrected, and the `payment-recording` wording ("minor currency units") is replaced with "whole rupees".

### Amount validation lives in the shared client layer

The web transaction form validates through one schema (`apps/web/lib/validation.ts`), so a single change to `z.number().int(...)` covers it. Mobile parses the amount in three separate screens, so a shared helper is added next to the existing `apps/app/lib/upi.ts` (`parseWholeRupeAmount`) and used by all three. Validating on the device rather than letting the API reject costs one round trip less and, on mobile, avoids turning a typo into a failed queue row that the user has to inspect and discard. The API message is still improved — "amount must be a whole number of rupees" — so that a non-browser client gets an actionable error.

### The web error path renders the envelope's field details

`toApiError` already carries `details`; the missing piece is a formatter that joins the field details to the envelope error, shared by the transaction toast and the dialog's inline error. The `web-data-fetching` requirement already says the UI shows the envelope `error` plus field `details`; today it does not, so this is a conformance fix rather than a new rule.

### A rejected mobile write is reported by the screen that submitted it

`processQueue` classifies a `4xx` as a permanent failure and stops, but it never rethrows, so `queueTransaction` resolves as if the write had been accepted. The queue's behaviour for genuinely offline writes stays exactly as it is — while offline the item is pending and the submission legitimately succeeds — but when the device is online and the server rejects the write, the promise rejects with the server's message and the recording screen shows it. Relying on the pending bar instead was rejected: the user is told the entry was recorded when it was not, which is the specific complaint in this change.

### Web freshness is invalidate-and-await; polling is demoted to a fallback

`invalidateQueries` marks an inactive query invalidated, and TanStack Query v5 treats an invalidated query as stale regardless of `staleTime` (`Query.isStaleByTime` returns `true` when `state.isInvalidated`, `node_modules/@tanstack/query-core/build/modern/query.js:245-250`), so a query invalidated while the dashboard was not mounted still refetches on the next visit. The refresh is therefore guaranteed rather than timing-dependent. The mutations must `await` the invalidation so the dialog closes onto fresh data, and the transaction mutations must also invalidate `customerKeys.all`, because a transaction changes the balance the customer domain displays. The `customerKeys` omission is a conformance fix against `web-api-integration`, which already requires every mutation to invalidate its domain keys.

Polling remains for writes made elsewhere (another device, another tab). The dashboard's metrics and recent-transactions intervals drop from 30 s to 10 s and the heavier analytics interval moves to 60 s; `refetchOnWindowFocus` stays off globally but the dashboard hooks override it to `true`, which `web-data-fetching` permits as a justified override. Making focus-refetch global was rejected: it would refetch every mounted query on every tab switch.

### Mobile freshness is a focus refetch plus a queue-aware merge

Customer detail and Collection gain `useFocusEffect`, matching Home, Ledger and Customers. The optimistic merge changes shape: a queued entry stays visible until the server list actually contains it, keyed by the client-generated identifier, instead of disappearing the moment the queue item flips to `synced`. For that key to exist end to end, `enqueue` must put the client UUID into the payload it stores, so the server receives the identifier its idempotency branch expects. That single change makes the existing server-side deduplication reachable, removes the double-create risk that the `offline-write-queue` spec forbids, and gives the client a stable key for the merge.

### The database is the source of truth for feature flags

The requirement is that the *administrator* controls the flags and that a user cannot. Three candidates were considered:

- *Environment variable* (`wrangler.jsonc` vars or a Worker secret): simple, no migration — but Workers bake vars at deploy time, so flipping a flag means a redeploy, and a rollback of that deploy silently flips the flag back.
- *Per-user flags in `user_settings`*: rejected outright — it hands the switch to exactly the person who must not have it, and it would add a per-user read to every request.
- *A table in the existing Postgres database*: the operator changes one row with one statement, no redeploy, no new credential, and the API stays the single source of truth that clients cannot tamper with. This is the option taken.

The table is small and appended to, so a new flag is a new row and needs no client release. The registry is seeded with `collection` and `upi_collection`, both enabled, so the deployment behaves exactly as it does today until an administrator changes something.

A read failure fails open — every registered flag resolves to enabled and the failure is logged — because hiding a working feature because of a transient database blip is worse than showing a feature the administrator had switched off. The opposite rule applies to an unknown key: a key the registry does not contain resolves to disabled, and clients ignore keys they do not recognise.

### Flag state is read at the points that gate, not by global middleware

Only the routes that actually gate something consult the registry: `GET /collection` and the settings read/write. A global middleware would add a database query to every request in the system to protect two endpoints, and would make the gating implicit. Clients read `GET /feature-flags` on a bounded cadence — a 60-second `staleTime` with focus refetch on web, a poll plus an app-state refresh on mobile — so an administrator's change is picked up without a user reload, within a minute.

`GET /feature-flags` is public. The registry holds no user data, the web client may want it before sign-in, and requiring a token would force every client to model an authentication error for data that is not sensitive.

### Enforcement is server-side as well as client-side

Hiding a navigation entry is a courtesy; the guarantee comes from the server. `GET /collection` answers `404` with the JSON error envelope while the flag is disabled. The settings response omits `upi_id` and `payee_name`, and a settings write that carries either field is refused with `403`, so a disabled configuration cannot be read or changed even by a client that ignores the flag. The UPI intent link and QR are assembled on the device from configuration the client already holds, so for those the client-side gate is the only possible enforcement — which is why the server refuses to serve the configuration in the first place.

### Both clients mirror the same flag contract

Web gets a `useFeatureFlags` hook on TanStack Query and a key module; the sidebar, the mobile bottom nav and the `/collection` page consult it, and the Settings page hides the UPI section. Mobile gets a `FeatureFlagsProvider` modelled on the existing `SettingsProvider` and mounted beside it in `apps/app/app/_layout.tsx`; the expo-router `<Tabs>` hides the Collection screen with `options={{ href: null }}` (the idiomatic way to remove a tab from an expo-router tab bar), and the Profile screen hides the payment-settings section. Both clients default to "enabled" when the registry cannot be read, matching the server's fail-open rule.

## Risks / Trade-offs

- **[A flag flip mid-session leaves a stale screen] →** the client re-reads the registry on a bounded cadence and the API refuses the gated routes, so a user who keeps an open screen sees the server's `404` rather than stale data; the clients treat a `404` from a gated route as "this feature is off" and hide the surface.
- **[The migration has not run when a new API deploys] →** the flag read fails open, so a missing `feature_flags` table degrades to today's behaviour rather than hiding features; the table is additive and the migration is applied before the clients are released.
- **[The web edit path changes what is sent to the API] →** the update payload is mapped field by field instead of spreading the form shape, which also fixes a latent bug: the form's `transactionType` was being sent where the API expects `type`, so Zod stripped it and the type never changed. The API contract test for transaction update covers the type field.
- **[A queued entry is kept visible longer than it should be] →** the merge only keeps an entry while the server list does not contain its identifier, and the entry is dropped on the next refresh that includes it, so a stale local row cannot persist.
- **[Enabling the flag does not restore a feature for users who never had the data] →** the gated surfaces were only ever hidden, never deleted; the settings row and the collection rows still exist, so re-enabling restores them.
- **[Denser polling costs API requests] →** only the dashboard polls, the heavier analytics interval is longer than the lightweight ones, and the same-client path does not rely on polling at all.
- **[The registry is per deployment, not per user] →** this is deliberate: the administrator controls the flags. A user who wants a feature the administrator has withdrawn does not get an override, and the application does not pretend otherwise.

## Migration Plan

1. Apply the additive migration that creates `feature_flags` and seeds `collection` and `upi_collection` as enabled. No existing table or row is altered.
2. Deploy the API: the new route, the flag guards and the improved validation message. Because the flag read fails open, this deploy is safe on its own.
3. Release the web and mobile clients. They gate on the registry, which currently reports both flags enabled, so the visible behaviour is unchanged apart from the recording fixes.
4. To switch a feature off, the administrator runs the documented flag script; the change is visible to clients within the bounded refresh window and enforced by the API immediately.

Rollback is a redeploy of the previous API and clients; the seeded rows can stay in place because nothing reads them when the route is absent.

## Open Questions

None. The two questions this change depends on — where the flags live and who controls them — were settled with the user before the artifacts were written, and the unit question was settled from the code, the exports and the documentation, which agree.
