// SQLite-backed offline write queue (design: "Offline queue: expo-sqlite
// queue + client-supplied UUIDs"). Writes are enqueued locally with a
// device-generated UUID, then replayed strictly FIFO. Successful items are
// marked synced; server rejections (4xx) become visible failed items;
// network/5xx failures stay pending for the next replay.
import * as SQLite from "expo-sqlite";
import * as Crypto from "expo-crypto";
import {
  applyOutcome,
  classifyFailure,
  isDuplicate,
  pendingInOrder,
  type ProcessOutcome,
  type QueueItem,
  type QueueKind,
} from "./queue-core";
import { ApiError } from "./api";

const DB_NAME = "ledgerx-offline.db";

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync(DB_NAME).then(async (db) => {
      await db.execAsync(`
        PRAGMA journal_mode = WAL;
        CREATE TABLE IF NOT EXISTS offline_queue (
          id TEXT PRIMARY KEY NOT NULL,
          kind TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'pending',
          seq INTEGER NOT NULL,
          payload TEXT NOT NULL,
          created_at TEXT NOT NULL,
          synced_at TEXT,
          attempts INTEGER NOT NULL DEFAULT 0,
          last_error TEXT
        );
        CREATE INDEX IF NOT EXISTS offline_queue_status_seq
          ON offline_queue (status, seq);
      `);
      return db;
    });
  }
  return dbPromise;
}

function rowToItem(row: {
  id: string;
  kind: string;
  status: string;
  seq: number;
  payload: string;
  created_at: string;
  synced_at: string | null;
  attempts: number;
  last_error: string | null;
}): QueueItem {
  return {
    id: row.id,
    kind: row.kind as QueueKind,
    status: row.status as QueueItem["status"],
    seq: row.seq,
    payload: JSON.parse(row.payload) as Record<string, unknown>,
    createdAt: row.created_at,
    syncedAt: row.synced_at,
    attempts: row.attempts,
    lastError: row.last_error,
  };
}

export async function newId(): Promise<string> {
  return Crypto.randomUUID();
}

/** Enqueue a write. Re-enqueueing a queued (non-synced) id is a no-op. */
export async function enqueue(
  kind: QueueKind,
  payload: Record<string, unknown>,
  id?: string,
): Promise<QueueItem> {
  const db = await getDb();
  const itemId = id ?? (await newId());

  const existing = await db.getFirstAsync<{
    id: string;
    kind: string;
    status: string;
    seq: number;
    payload: string;
    created_at: string;
    synced_at: string | null;
    attempts: number;
    last_error: string | null;
  }>("SELECT * FROM offline_queue WHERE id = ? LIMIT 1", [itemId]);

  if (existing && isDuplicate([rowToItem(existing)], itemId)) {
    return rowToItem(existing);
  }

  await db.runAsync(
    `INSERT OR IGNORE INTO offline_queue
       (id, kind, status, seq, payload, created_at)
     VALUES (?, ?, 'pending',
       COALESCE((SELECT MAX(seq) FROM offline_queue), 0) + 1, ?, ?)`,
    [itemId, kind, JSON.stringify(payload), new Date().toISOString()],
  );

  const row = await db.getFirstAsync<
    Parameters<typeof rowToItem>[0]
  >("SELECT * FROM offline_queue WHERE id = ? LIMIT 1", [itemId]);
  return rowToItem(row!);
}

export async function listAll(): Promise<QueueItem[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<Parameters<typeof rowToItem>[0]>(
    "SELECT * FROM offline_queue ORDER BY seq ASC",
  );
  return rows.map(rowToItem);
}

export async function pendingCount(): Promise<number> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) as count FROM offline_queue WHERE status = 'pending'",
  );
  return row?.count ?? 0;
}

/** Items still queued (pending or failed) — used for the pending indicator. */
export async function outstandingCount(): Promise<number> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) as count FROM offline_queue WHERE status != 'synced'",
  );
  return row?.count ?? 0;
}

async function writeOutcome(outcome: ProcessOutcome): Promise<void> {
  const db = await getDb();
  if (outcome.result === "synced") {
    await db.runAsync(
      "UPDATE offline_queue SET status = 'synced', synced_at = ?, last_error = NULL, attempts = attempts + 1 WHERE id = ?",
      [outcome.syncedAt, outcome.id],
    );
  } else if (outcome.result === "failed") {
    await db.runAsync(
      "UPDATE offline_queue SET status = 'failed', last_error = ?, attempts = attempts + 1 WHERE id = ?",
      [outcome.error, outcome.id],
    );
  } else {
    await db.runAsync(
      "UPDATE offline_queue SET last_error = ?, attempts = attempts + 1 WHERE id = ?",
      [outcome.error, outcome.id],
    );
  }
}

/** A user-facing retry of a failed item: back to pending for the next replay. */
export async function retryItem(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    "UPDATE offline_queue SET status = 'pending', last_error = NULL WHERE id = ?",
    [id],
  );
}

/** Discard a failed item; the write is abandoned, never silently dropped. */
export async function discardItem(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync("DELETE FROM offline_queue WHERE id = ?", [id]);
}

export type Executor = (
  kind: QueueKind,
  payload: Record<string, unknown>,
) => Promise<unknown>;

/**
 * Process pending items strictly FIFO. A transaction whose customer was
 * created in the same offline session therefore replays after that customer.
 * Returns the number of items accepted by the server.
 */
export async function processQueue(executor: Executor): Promise<number> {
  const db = await getDb();
  const rows = await db.getAllAsync<Parameters<typeof rowToItem>[0]>(
    "SELECT * FROM offline_queue WHERE status = 'pending' ORDER BY seq ASC",
  );
  const items = rows.map(rowToItem);
  let accepted = 0;

  for (const item of pendingInOrder(items)) {
    let outcome: ProcessOutcome;
    try {
      await executor(item.kind, item.payload);
      outcome = {
        id: item.id,
        result: "synced",
        syncedAt: new Date().toISOString(),
      };
      accepted += 1;
    } catch (error) {
      const status = error instanceof ApiError ? error.status : null;
      const message =
        error instanceof Error ? error.message : "Unknown sync error";

      outcome =
        classifyFailure(status) === "permanent"
          ? { id: item.id, result: "failed", error: message }
          : { id: item.id, result: "retry", error: message };
    }

    await writeOutcome(outcome);

    // A permanent failure must not block later items, but a transient one
    // usually means offline — stop to preserve order-dependent writes.
    if (outcome.result === "retry") break;
  }

  return accepted;
}

/** Restart persistence: the table survives process death; nothing to do. */
export async function initQueue(): Promise<void> {
  await getDb();
}

export const __testing = {
  rowToItem,
  applyOutcome,
};
