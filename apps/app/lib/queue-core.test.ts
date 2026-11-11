import { describe, expect, it } from "bun:test";
import {
  applyOutcome,
  classifyFailure,
  entriesNotIn,
  isDuplicate,
  nextPending,
  pendingInOrder,
  queuePayload,
  queuedEntriesFrom,
  submissionRejection,
  type QueueItem,
} from "./queue-core";

function item(overrides: Partial<QueueItem> = {}): QueueItem {
  return {
    id: "00000000-0000-4000-8000-000000000001",
    kind: "customer.create",
    status: "pending",
    seq: 1,
    payload: { name: "Ramesh", phone: "+91 99999 00001" },
    createdAt: "2026-01-01T00:00:00.000Z",
    syncedAt: null,
    attempts: 0,
    lastError: null,
    ...overrides,
  };
}

describe("pendingInOrder", () => {
  it("returns only pending items sorted by seq", () => {
    const items = [
      item({ id: "a", seq: 3 }),
      item({ id: "b", seq: 1, status: "synced" }),
      item({ id: "c", seq: 2, status: "failed" }),
      item({ id: "d", seq: 0 }),
    ];

    expect(pendingInOrder(items).map((i) => i.id)).toEqual(["d", "a"]);
  });

  it("keeps customer-before-transaction order from enqueue time", () => {
    const customer = item({ id: "customer", seq: 10, kind: "customer.create" });
    const tx = item({
      id: "tx",
      seq: 11,
      kind: "transaction.create",
      payload: { customerId: "customer", amount: 500, type: "credit" },
    });

    expect(pendingInOrder([tx, customer]).map((i) => i.id)).toEqual([
      "customer",
      "tx",
    ]);
  });
});

describe("isDuplicate", () => {
  it("flags an id that is still pending or failed", () => {
    const items = [item({ id: "a" }), item({ id: "b", status: "failed" })];
    expect(isDuplicate(items, "a")).toBe(true);
    expect(isDuplicate(items, "b")).toBe(true);
    expect(isDuplicate(items, "c")).toBe(false);
  });

  it("allows re-enqueueing a synced id (server replay is idempotent)", () => {
    const items = [item({ id: "a", status: "synced", syncedAt: "x" })];
    expect(isDuplicate(items, "a")).toBe(false);
  });
});

describe("classifyFailure", () => {
  it("marks validation rejections permanent", () => {
    expect(classifyFailure(400)).toBe("permanent");
    expect(classifyFailure(404)).toBe("permanent");
    expect(classifyFailure(422)).toBe("permanent");
  });

  it("marks network and server failures transient", () => {
    expect(classifyFailure(null)).toBe("transient");
    expect(classifyFailure(500)).toBe("transient");
    expect(classifyFailure(503)).toBe("transient");
  });

  it("treats timeouts and rate limits as transient", () => {
    expect(classifyFailure(408)).toBe("transient");
    expect(classifyFailure(429)).toBe("transient");
  });
});

describe("applyOutcome", () => {
  it("marks the item synced and clears the error", () => {
    const syncedAt = "2026-01-02T00:00:00.000Z";
    const items = applyOutcome([item()], {
      id: "00000000-0000-4000-8000-000000000001",
      result: "synced",
      syncedAt,
    });

    expect(items[0].status).toBe("synced");
    expect(items[0].syncedAt).toBe(syncedAt);
    expect(items[0].lastError).toBeNull();
    expect(items[0].attempts).toBe(1);
  });

  it("marks permanent failures visible without dropping them", () => {
    const items = applyOutcome([item()], {
      id: "00000000-0000-4000-8000-000000000001",
      result: "failed",
      error: "Invalid phone",
    });

    expect(items[0].status).toBe("failed");
    expect(items[0].lastError).toBe("Invalid phone");
  });

  it("keeps transient failures pending for the next replay", () => {
    const items = applyOutcome([item()], {
      id: "00000000-0000-4000-8000-000000000001",
      result: "retry",
      error: "Network unavailable",
    });

    expect(items[0].status).toBe("pending");
    expect(items[0].lastError).toBe("Network unavailable");
    expect(items[0].attempts).toBe(1);
  });

  it("leaves other items untouched", () => {
    const other = item({ id: "other", seq: 2 });
    const items = applyOutcome([item(), other], {
      id: "00000000-0000-4000-8000-000000000001",
      result: "synced",
      syncedAt: "x",
    });

    expect(items[1]).toBe(other);
  });
});

describe("nextPending", () => {
  it("returns the lowest-seq pending item", () => {
    const items = [item({ id: "later", seq: 5 }), item({ id: "first", seq: 2 })];
    expect(nextPending(items)?.id).toBe("first");
  });

  it("returns null when nothing is pending", () => {
    expect(nextPending([item({ status: "synced" })])).toBeNull();
  });
});

describe("queuePayload", () => {
  it("carries the device id so the server can deduplicate a replay", () => {
    const payload = queuePayload("00000000-0000-4000-8000-000000000001", {
      customerId: "customer-1",
      amount: 500,
      type: "credit",
    });

    expect(payload.id).toBe("00000000-0000-4000-8000-000000000001");
    expect(payload.amount).toBe(500);
  });

  it("replays under the same id, so the server holds one record", () => {
    const id = "00000000-0000-4000-8000-000000000001";
    const body = { customerId: "customer-1", amount: 500, type: "credit" };

    const first = queuePayload(id, body);
    const replay = queuePayload(id, body);

    expect(replay.id).toBe(first.id);
  });

  it("does not let a payload override the device id", () => {
    const payload = queuePayload("00000000-0000-4000-8000-000000000001", {
      id: "someone-elses-id",
    });

    expect(payload.id).toBe("00000000-0000-4000-8000-000000000001");
  });
});

describe("entriesNotIn", () => {
  const queued = queuedEntriesFrom([
    item({ id: "pending", kind: "transaction.create" }),
    item({
      id: "synced",
      kind: "transaction.create",
      status: "synced",
      syncedAt: "x",
      payload: {
        id: "synced",
        customerId: "customer-1",
        amount: 500,
        type: "credit",
      },
    }),
    item({
      id: "published",
      kind: "transaction.create",
      status: "synced",
      syncedAt: "x",
      payload: {
        id: "published",
        customerId: "customer-1",
        amount: 500,
        type: "credit",
      },
    }),
  ]);

  it("keeps a write the server has not accepted", () => {
    const missing = entriesNotIn(queued, []);
    expect(missing.map((entry) => entry.id)).toContain("pending");
  });

  it("keeps a synced write the server list does not hold yet", () => {
    const missing = entriesNotIn(queued, ["published"]);
    expect(missing.map((entry) => entry.id)).toEqual(["pending", "synced"]);
  });

  it("drops a write the server list already holds", () => {
    const missing = entriesNotIn(queued, ["published", "synced"]);
    expect(missing.map((entry) => entry.id)).toEqual(["pending"]);
  });
});

describe("submissionRejection", () => {
  it("reports the server's message for a permanently rejected write", () => {
    const items = applyOutcome([item()], {
      id: "00000000-0000-4000-8000-000000000001",
      result: "failed",
      error: "Validation failed · amount must be a whole number of rupees",
    });

    expect(
      submissionRejection(items, "00000000-0000-4000-8000-000000000001"),
    ).toBe("Validation failed · amount must be a whole number of rupees");
  });

  it("reports nothing for a write that is still pending", () => {
    expect(
      submissionRejection([item()], "00000000-0000-4000-8000-000000000001"),
    ).toBeNull();
  });

  it("reports nothing for a write the server accepted", () => {
    const items = applyOutcome([item()], {
      id: "00000000-0000-4000-8000-000000000001",
      result: "synced",
      syncedAt: "2026-01-02T00:00:00.000Z",
    });

    expect(
      submissionRejection(items, "00000000-0000-4000-8000-000000000001"),
    ).toBeNull();
  });

  it("reports nothing for an unknown id", () => {
    expect(submissionRejection([item()], "other")).toBeNull();
  });
});
