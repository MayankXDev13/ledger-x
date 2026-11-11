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


/**
 * Guards the queue against two concurrent replays.
 *
 * The queue is owned by one provider for the whole app, but several screens
 * can still ask for a sync at the same moment (a reconnect plus a foreground
 * plus a manual retry). This guard makes the second caller wait for the first
 * instead of racing it over the same FIFO rows.
 */
export function createReplayGuard() {
  let running = false;

  return {
    isRunning: () => running,
    /** Runs `task` unless a replay is already in flight. */
    async run<T>(task: () => Promise<T>): Promise<T | null> {
      if (running) return null;
      running = true;
      try {
        return await task();
      } finally {
        running = false;
      }
    },
  };
}

/** A transaction the queue knows about. */
export interface QueuedEntry {
  id: string;
  customerId: string;
  amount: number;
  type: "credit" | "debit";
  paymentMethod: string | null;
  note: string | null;
  createdAt: string;
  /** True while the server has not accepted the write. */
  pending: boolean;
}

/**
 * Every transaction the queue knows about.
 *
 * A write the server has not accepted is marked pending. A write the server
 * did accept stays in the list until the server list holds it under the same
 * id, so it does not blink out of a list before that list is refetched.
 * Entries queued before the device id travelled with the payload are left
 * out: the server published those under another id, so showing them again
 * would duplicate a row.
 */
export function queuedEntriesFrom(items: QueueItem[]): QueuedEntry[] {
  return items
    .filter((item) => item.kind === "transaction.create")
    .filter((item) => item.status !== "synced" || item.payload.id === item.id)
    .map((item) => ({
      id: item.id,
      customerId: String(item.payload.customerId ?? ""),
      amount: Number(item.payload.amount ?? 0),
      type: item.payload.type === "debit" ? "debit" : "credit",
      paymentMethod: (item.payload.paymentMethod as string | null) ?? null,
      note: (item.payload.note as string | null) ?? null,
      createdAt: item.createdAt,
      pending: item.status !== "synced",
    }));
}

/** A queued customer the server has not accepted yet. */
export interface PendingCustomer {
  id: string;
  name: string;
  phone: string;
}

/**
 * The payload a queued write is replayed with.
 *
 * The device-generated id travels with the payload, so a replay of the same
 * queued write reaches the server under the same id and the server returns
 * the record it already holds instead of creating a second one.
 */
export function queuePayload(
  id: string,
  payload: Record<string, unknown>,
): Record<string, unknown> {
  return { ...payload, id };
}

/**
 * The rejection a submission has to surface, if any.
 *
 * A write the server permanently rejected must be reported by the screen that
 * submitted it, not left as a silent failure in the queue. A write that is
 * still pending (the device is offline) or that the server accepted reports
 * nothing: both are legitimate outcomes of a submission.
 */
export function submissionRejection(
  items: QueueItem[],
  id: string,
): string | null {
  const item = items.find((entry) => entry.id === id);
  if (!item || item.status !== "failed") return null;
  return item.lastError ?? "The server rejected this entry";
}

/**
 * The queued entries a server list does not hold yet.
 *
 * A screen shows these next to the server's own rows: an entry the server
 * has not accepted is still pending, and an entry the server accepted but has
 * not published yet stays in the list instead of blinking out of it.
 */
export function entriesNotIn(
  queued: QueuedEntry[],
  serverIds: readonly string[],
): QueuedEntry[] {
  const known = new Set(serverIds);
  return queued.filter((entry) => !known.has(entry.id));
}

/** Projects the queue into the customers that are still waiting to sync. */
export function pendingCustomersFrom(items: QueueItem[]): PendingCustomer[] {
  return items
    .filter((item) => item.kind === "customer.create" && item.status !== "synced")
    .map((item) => ({
      id: item.id,
      name: String(item.payload.name ?? ""),
      phone: String(item.payload.phone ?? ""),
    }));
}
