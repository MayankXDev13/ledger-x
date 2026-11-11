# Proposal

## Why

Recording a transaction is the one action a shopkeeper cannot afford to get wrong, and today it fails in two ways. The API only accepts integer amounts (`amount: z.number().int()`, `apps/api/src/validators.ts:19`) while both clients accept decimals and send them through, so every entry with paise is rejected with a bare `400 Validation failed` — a message the web client throws away (`apps/web/lib/api-error.ts` keeps `details`, `apps/web/hooks/useTransactions.ts:50` shows only `err.message`) and the mobile client swallows entirely, because the offline queue turns a rejected write into a "synced-looking" queue row instead of an error (`apps/app/lib/offline-queue.ts:193-212`). When the write does succeed, the new entry is not visible where the user looks for it: the web dashboard only refreshes on a 30-second poll (`apps/web/hooks/useDashboard.ts:17,25,33`), and the mobile customer detail and collection screens refetch only on mount, so the entry appears late or vanishes when the optimistic row is dropped (`apps/app/app/customers/details.tsx:86-88`, `apps/app/app/(tabs)/collection.tsx:193-213`).

At the same time the product has no way to turn a shipped feature off for a deployment. There is no flag registry, no per-feature setting, and no environment switch — `user_settings` holds only `upi_id`, `payee_name` and two onboarding timestamps (`apps/api/src/db/schema.ts:147-157`). The administrator cannot withdraw the Collection tab or the UPI configuration without a code change and a redeploy.

## What Changes

**Transaction recording correctness and freshness**

- Clients validate amounts against the ledger unit before submitting: the ledger stores **whole rupees** in an integer column (`apps/api/src/db/schema.ts:232`, `docs/upi-collection.md:34`, `docs/data-portability.md:5`), so the web form, the mobile add screen, the mobile quick-entry modal and the mobile edit modal reject a fractional rupee with an inline message instead of sending a write the API will refuse. The stale `// Store amount in paise/cents` comment and the "minor currency units" wording in the `payment-recording` spec are corrected to match the implemented unit.
- The API keeps its integer contract and returns a field-level message that names the unit, so the rejection is actionable.
- A write rejected by the API is reported to the user. On web the envelope `error` plus field `details` reach the screen instead of a generic "Validation failed" — which the existing `web-data-fetching` spec already requires. On mobile a permanent rejection during the immediate online submission is surfaced by the recording screen instead of being announced as a success.
- A newly recorded transaction appears immediately on the dashboard and on the customer page on both platforms, without waiting for a polling interval or a manual pull-to-refresh. Web transaction mutations invalidate and await the refetch of every dependent domain (dashboard, customer, customer-transactions, collection, statements); mobile screens that display transactions refetch when they regain focus, a queued credit against an existing customer shows up in the collection outstanding list, and a synced write refreshes the views that display it.
- The web edit path stops sending the wrong field name, so changing a transaction's type actually changes it.

**Admin-controlled feature flags**

- A new `feature_flags` registry in the database, owned by the deployment administrator, exposed to clients through a read-only API. Users cannot change a flag value and no client-supplied input can influence one.
- Two flags ship enabled by default: `collection` gates the Collection tab and the receivables collection view (web sidebar, mobile bottom tab, `GET /collection`), and `upi_collection` gates the UPI ID / payee name configuration (web Settings, mobile Profile) together with the UPI QR and intent-link surfaces.
- A disabled feature is genuinely unavailable, not merely hidden: the navigation entry is not rendered, the screen is not reachable, and the API route answers `404` with the JSON error envelope.
- The registry is extensible — a new flag is a new row, with no client release — and the administrator flips flags without a redeploy.

**Not in scope**: no change to the ledger's storage unit or a migration of stored amounts; no new payment methods; no removal of the Collection or UPI features themselves, only the ability to switch them off; no user-facing switch to enable a disabled feature.

## Capabilities

### New Capabilities

- `feature-flags`: admin-controlled registry of feature flags, the API contract that publishes them, the rule that a disabled feature is unavailable end to end, and the admin path for changing a flag without a redeploy.

### Modified Capabilities

- `payment-recording`: the amount contract is stated in whole rupees, fractional amounts are rejected with a field-level message, and the ledger-unit wording is corrected.
- `web-data-fetching`: mutations await the refetch of the keys they invalidate and surface the envelope field details; a recorded transaction refreshes every affected view immediately.
- `web-api-integration`: a transaction write invalidates the customer, dashboard, collection and statement domains in addition to its own.
- `offline-write-queue`: a permanently rejected write is reported at submission time instead of being reported as success, and a synced or pending write refreshes and appears in the views that display it.
- `mobile-shop-ui`: customer detail and collection refetch on focus; the Collection tab and the Profile payment-settings section follow their flags.
- `upi-collection`: the collection view and the UPI configuration are gated by administrator flags, and the gated API routes are unavailable while a flag is disabled.
- `customer-transaction-summary`: a newly recorded entry appears in the customer detail list and its aggregates without a manual reload.
- `dashboard-analytics`: the dashboard reflects a newly recorded transaction without waiting for the polling interval.

## Impact

- **API** (`apps/api`): a `feature_flags` Drizzle table plus migration, a `GET /feature-flags` route, a `feature-flags` library that reads the registry and fails open on infrastructure errors, a `404` guard on `GET /collection`, a guard that omits `upi_id` / `payee_name` from `GET /settings` and rejects writes to them, a clearer integer-amount validation message, and contract tests for every new behaviour.
- **Web** (`apps/web`): whole-rupee validation in the transaction form, error details surfaced in the transaction dialog and toasts, transaction mutations awaiting their cross-domain refetch, a `useFeatureFlags` hook, the Collection sidebar entry and `/collection` route and the Settings "UPI collections" section gated on the registry, and shorter dashboard polling as a cross-device safety net.
- **Mobile** (`apps/app`): whole-rupee validation in the add, quick-entry and edit screens, failed queue writes reported by the recording screen, focus-based refetch on the customer detail and collection screens, pending entries merged into the collection outstanding list, a `FeatureFlagsProvider` alongside `SettingsProvider`, and the Collection tab and Profile payment-settings section gated on the registry.
- **Docs**: a `docs/feature-flags.md` describing the registry, the flag keys, and the admin procedure for flipping a flag.
- **Data**: one additive migration creating `feature_flags` and seeding it with `collection` and `upi_collection` enabled. No existing rows are read or rewritten; no stored amount changes.
