import { describe, expect, it } from "bun:test";
import {
  applyOutcome,
  classifyFailure,
  isDuplicate,
  nextPending,
  pendingInOrder,
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
