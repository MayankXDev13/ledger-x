# Tasks

## 1. Ledger unit contract

- [x] 1.1 Correct the misleading `// Store amount in paise/cents` comment above `transactions.amount` in `apps/api/src/db/schema.ts` to state that the column holds whole rupees, and verify the column type is left unchanged by `git diff` on that file showing only the comment line.
- [x] 1.2 Change the API's amount validator in `apps/api/src/validators.ts` to reject a non-integer amount with a message naming the unit ("amount must be a whole number of rupees") while keeping the zero/negative rejection, and verify `bun test` in `apps/api` passes with an updated assertion on that message in `apps/api/src/test/validation.test.ts`.
- [x] 1.3 Make the web transaction schema require a whole number of rupees in `apps/web/lib/validation.ts` and set the amount input's step to `1` in `apps/web/components/transactions/TransactionDialog.tsx`, and verify a new `apps/web/lib/validation.test.ts` case asserts that `1250.5` fails with the whole-rupee message and `1250` passes.
- [x] 1.4 Add a shared `parseWholeRupeAmount` helper beside `apps/app/lib/upi.ts` that returns the whole-rupee value or an error, and cover it in `apps/app/lib/amount.test.ts` with cases for a whole amount, a fractional amount and an empty amount; verify `bun test` in `apps/app` passes.
- [x] 1.5 Use the helper in `apps/app/app/ledger/add.tsx`, `apps/app/components/QuickEntryModal.tsx` and `apps/app/components/EditTransactionModal.tsx` so a fractional amount is refused inline and nothing is queued, and verify each screen shows the inline message and issues no request.

## 2. Rejected writes reach the user

- [x] 2.1 Add a formatter in `apps/web/lib/api-error.ts` that joins the envelope `error` to its field `details`, and cover it in a new `apps/web/lib/api-error.test.ts` asserting that a `400` with `details.amount` produces a message naming the field and that a bare error keeps its original text; verify `bun test` in `apps/web` passes.
- [x] 2.2 Use that formatter for the transaction mutation toasts in `apps/web/hooks/useTransactions.ts` and for the inline error in `apps/web/components/transactions/TransactionDialog.tsx`, and verify that a rejected save shows the field detail instead of only "Validation failed".
- [x] 2.3 Make `queueTransaction` and `queueCustomer` in `apps/app/hooks/useOfflineQueue.tsx` reject with the server's message when the immediate online submission is permanently rejected, while keeping the offline behaviour (the item stays pending and the submission succeeds), and verify the new case in `apps/app/lib/queue-core.test.ts` and `apps/app/lib/queue-single-replay.test.ts`.
- [x] 2.4 Catch that rejection in `apps/app/app/ledger/add.tsx` and `apps/app/components/QuickEntryModal.tsx` and show the server's message instead of announcing the entry as recorded, and verify the screen shows the rejection and does not navigate away.

## 3. Web freshness after a write

- [x] 3.1 Add `customerKeys.all` to the transaction create, update and delete invalidations in `apps/web/hooks/useTransactions.ts` and `await` the invalidation so the mutation settles after the dependent queries have refetched, and verify the customer list and customer detail show the new balance without a manual reload.
- [x] 3.2 Map the edit payload field by field in `apps/web/components/transactions/TransactionDialog.tsx` so the update sends `type` instead of the form's `transactionType`, and verify that editing a transaction's type now changes it on the server.
- [x] 3.3 Set the dashboard polling intervals in `apps/web/hooks/useDashboard.ts` to 10 s for metrics and recent transactions and 60 s for analytics, and add a justified `refetchOnWindowFocus: true` override on those hooks while leaving the global default in `apps/web/components/providers/QueryProvider.tsx` unchanged, and verify the dashboard reflects a write made on another device within the interval.

## 4. Mobile freshness after a write

- [x] 4.1 Add `useFocusEffect` refetches to `apps/app/app/customers/details.tsx` and `apps/app/app/(tabs)/collection.tsx`, and verify that returning to either screen after recording an entry reloads its data without a pull-to-refresh.
- [x] 4.2 Store the client-generated identifier in the queued payload in `apps/app/hooks/useOfflineQueue.tsx` so the server receives it, and verify that replaying the same queue item twice leaves exactly one server-side transaction by asserting on the request payload in `apps/app/lib/queue-core.test.ts`.
- [x] 4.3 Change the optimistic merge so a queued entry stays visible until the server list contains its identifier, instead of being dropped when the queue item flips to `synced`, and cover both states in `apps/app/lib/queue-core.test.ts`.
- [x] 4.4 Merge queued entries for existing customers into the collection outstanding list in `apps/app/app/(tabs)/collection.tsx`, and verify that a queued credit shows in the outstanding list marked as pending.

## 5. Feature-flag registry on the API

- [x] 5.1 Add a `featureFlags` table (`key` primary key, `enabled`, `label`, `description`, `updatedAt`) to `apps/api/src/db/schema.ts`, generate the additive migration with `bun run db:generate` in `apps/api`, and verify the generated SQL creates only the new table and seeds `collection` and `upi_collection` as enabled.
- [x] 5.2 Add `apps/api/src/lib/feature-flags.ts` with a reader that returns the registry, resolves an unregistered key to disabled and fails open with a logged warning when the table cannot be read, and cover all three behaviours in a new `apps/api/src/test/feature-flags.test.ts`.
- [x] 5.3 Add the `GET /feature-flags` route returning `{ flags: { key: boolean } }` without authentication, register it in `apps/api/src/app.ts`, and add it to the OpenAPI operations, models and route discovery so `bun run openapi:check` in `apps/api` passes.
- [x] 5.4 Guard `GET /collection` in `apps/api/src/routes/collection.ts` so it responds `404` with the JSON error envelope while the `collection` flag is disabled, and guard `GET /settings` and `PUT /settings` in `apps/api/src/routes/settings.ts` so the UPI fields are withheld and writes to them are refused with `403` while the `upi_collection` flag is disabled; verify each case in `apps/api/src/test/collection.test.ts` and `apps/api/src/test/settings.test.ts`.
- [x] 5.5 Extend the API contract suite to cover the new route and both guards, and verify `bun test` in `apps/api` passes with no live database, network or Supabase project.

## 6. Feature flags on the web client

- [x] 6.1 Add the known flag keys and a `useFeatureFlags` hook on TanStack Query in `apps/web`, with a 60-second stale time and focus refetch, defaulting to enabled when the registry cannot be read, and verify the hook resolves the seeded flags.
- [x] 6.2 Gate the Collection navigation entry in `apps/web/components/AppSidebar.tsx` and `apps/web/components/MobileBottomNav.tsx` and refuse to render `apps/web/app/(app)/collection/page.tsx` when the `collection` flag is disabled, and verify the entry disappears and the page does not render.
- [x] 6.3 Hide the "UPI collections" section in `apps/web/app/(app)/settings/page.tsx` when the `upi_collection` flag is disabled, and verify the section is absent and the rest of the page is unchanged.

## 7. Feature flags on the mobile client

- [x] 7.1 Add a `FeatureFlagsProvider` and `useFeatureFlags` hook modelled on `apps/app/lib/settings-provider.tsx`, mount the provider beside `SettingsProvider` in `apps/app/app/_layout.tsx`, and default to enabled when the registry cannot be read; verify the provider mounts without breaking app start-up.
- [x] 7.2 Hide the Collection tab in `apps/app/app/(tabs)/_layout.tsx` with `options={{ href: null }}` and refuse to render `apps/app/app/(tabs)/collection.tsx` when the `collection` flag is disabled, and verify the tab disappears and the screen does not render.
- [x] 7.3 Hide the payment-settings section in `apps/app/app/(tabs)/profile.tsx` and the scan-to-pay hero and QR quick actions in the collection screen when the `upi_collection` flag is disabled, and verify each surface is absent while the outstanding list is still shown.

## 8. Administrator path and documentation

- [x] 8.1 Add `apps/api/scripts/set-feature-flag.ts` that flips a flag with `--key` and `--enable`, following the connection pattern in `apps/api/scripts/db-migrate.ts`, expose it as a `db:feature-flag` package script in `apps/api/package.json`, and verify that running it against a seeded database changes the flag and that the script prints the new state.
- [x] 8.2 Write `docs/feature-flags.md` covering the flag keys, what each one gates, the administrator procedure to flip a flag and to confirm the new state, and the fail-open behaviour, and verify every command quoted in the document runs as written.
- [x] 8.3 Note the flag registry and the administrator procedure in `README.md` alongside the existing feature list, and verify the link resolves to the new document.

## 9. Integration verification

- [x] 9.1 Run `bun run test`, `bun run typecheck` and `bun run lint` from the repository root and verify all three pass with the new API, web and mobile tests included.
- [x] 9.2 Walk through the reported flow on web and mobile: record a transaction with a whole amount and see it on the dashboard and the customer page at once, attempt a fractional amount and confirm it is refused before any request, disable the `collection` flag and confirm the tab, the screen and the route are all unavailable, and re-enable it and confirm they come back.
