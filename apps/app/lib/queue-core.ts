// Pure core of the offline write queue. Kept free of expo/sqlite imports so
// `bun test` can cover ordering, deduplication, and retry classification
// without a device or native module.

export type QueueKind = "customer.create" | "transaction.create";

export type QueueStatus = "pending" | "synced" | "failed";

export interface QueueItem {
  /** Device-generated UUID; also the server primary key (idempotency key). */
  id: string;
  kind: QueueKind;
  status: QueueStatus;
  /** Monotonic sequence preserving enqueue order; FIFO processing key. */
  seq: number;
  payload: Record<string, unknown>;
  createdAt: string;
  syncedAt: string | null;
  attempts: number;
  lastError: string | null;
}

/** Items the processor should attempt: pending, in enqueue order. */
export function pendingInOrder(items: QueueItem[]): QueueItem[] {
  return items
    .filter((item) => item.status === "pending")
    .sort((a, b) => a.seq - b.seq);
}

/**
 * Deduplicate by device id: enqueueing a retry of an item that is still
 * queued (any non-synced state) is a no-op. Synced items can never repeat
 * because the server treats a replay of the id as idempotent.
 */
export function isDuplicate(items: QueueItem[], id: string): boolean {
  return items.some((item) => item.id === id && item.status !== "synced");
}

export type FailureKind = "permanent" | "transient";

/**
 * Classify a failure. 4xx (except 408/429) means the server rejected the
 * payload — retrying unchanged will never succeed, so the item becomes a
 * visible failed entry. Network errors and 5xx stay pending for replay.
 */
export function classifyFailure(status: number | null): FailureKind {
  if (status === null) return "transient";
  if (status === 408 || status === 429) return "transient";
  if (status >= 500) return "transient";
  if (status >= 400) return "permanent";
  return "transient";
}

/** Outcome of one processing attempt over a queue snapshot. */
export type ProcessOutcome =
  | { id: string; result: "synced"; syncedAt: string }
  | { id: string; result: "failed"; error: string }
  | { id: string; result: "retry"; error: string };

export function applyOutcome(
  items: QueueItem[],
  outcome: ProcessOutcome,
): QueueItem[] {
  return items.map((item) => {
    if (item.id !== outcome.id) return item;

    if (outcome.result === "synced") {
      return {
        ...item,
        status: "synced",
        syncedAt: outcome.syncedAt,
        lastError: null,
        attempts: item.attempts + 1,
      };
    }

    if (outcome.result === "failed") {
      return {
        ...item,
        status: "failed",
        lastError: outcome.error,
        attempts: item.attempts + 1,
      };
    }

    // Retry: stays pending so the next replay picks it up again.
    return {
      ...item,
      status: "pending",
      lastError: outcome.error,
      attempts: item.attempts + 1,
    };
  });
}

/** The next pending item, respecting dependency order via `seq`. */
export function nextPending(items: QueueItem[]): QueueItem | null {
  return pendingInOrder(items)[0] ?? null;
}
