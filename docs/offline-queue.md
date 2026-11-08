# Offline write queue (mobile)

Mobile writes go through a local SQLite queue so entries captured without
connectivity are never lost and never duplicated.

## Semantics

- Every customer/transaction creation gets a **device-generated UUID** that is
  also the server primary key. Replaying an accepted write returns the existing
  owned record (idempotent), so retries are safe.
- The queue is **strictly FIFO** (`seq` ordering): a customer created offline is
  replayed before the transactions that reference its id.
- On success the item is marked `synced`. On a permanent rejection
  (`4xx` except 408/429) it becomes a **visible failed item** with the server's
  error message — never silently dropped. On network errors and `5xx` it stays
  `pending` and is retried automatically.
- A transient failure stops the replay pass so later, order-dependent writes
  are not attempted against a still-offline server.

## States

| State | Meaning | User-visible as |
| --- | --- | --- |
| `pending` | waiting to sync | "N changes will sync automatically" |
| `synced` | accepted by the server | disappears from the bar |
| `failed` | server rejected (validation etc.) | listed with **Retry** / **Discard** |

## Reproducing the states

1. **Pending**: enable airplane mode, add a customer + entry. The dashboard and
   customers screens show the offline bar with the count; the entries are
   visible immediately as local-only writes.
2. **Restart persistence**: force-quit and reopen the app while still offline —
   the items are still pending (SQLite table, WAL mode).
3. **Synced exactly once**: disable airplane mode. Replay runs on the
   connectivity transition and on app foreground; each item is sent once
   (server-side idempotency makes even duplicate sends harmless) and the bar
   disappears.
4. **Failed**: temporarily point `EXPO_PUBLIC_API_URL` at an endpoint that
   rejects the payload (or create a duplicate-phone customer while online rules
   changed) — the item is listed under the bar with the server's message; Retry
   re-queues it, Discard deletes it.

## Stale reads while offline

Reads use the normal API. While offline, screens label the data as cached
(e.g. the customers header shows "showing cached data (offline)") and refresh
from the API after reconnect.

## Implementation map

- Pure core: `apps/app/lib/queue-core.ts` (ordering, dedup, failure
  classification) — unit-tested in `queue-core.test.ts`.
- SQLite queue: `apps/app/lib/offline-queue.ts`.
- Controller/triggers: `apps/app/hooks/useOfflineQueue.ts` (connectivity change
  + app foreground replay) and `apps/app/components/OfflinePendingBar.tsx`.
- Server idempotency: client-supplied `id` on `POST /customers` and
  `POST /transactions` (see `apps/api/src/test/idempotency.test.ts`).
