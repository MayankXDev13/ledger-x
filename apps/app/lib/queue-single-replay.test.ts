import { describe, expect, it } from "bun:test";
import {
  applyOutcome,
  createReplayGuard,
  pendingCustomersFrom,
  queuedEntriesFrom,
  submissionRejection,
  type QueueItem,
} from "./queue-core";

function item(overrides: Partial<QueueItem> = {}): QueueItem {
  return {
    id: "00000000-0000-4000-8000-000000000001",
    kind: "transaction.create",
    status: "pending",
    seq: 1,
    payload: {
      customerId: "customer-1",
      amount: 500,
      type: "credit",
      paymentMethod: null,
      note: "Groceries",
    },
    createdAt: "2026-01-01T00:00:00.000Z",
    syncedAt: null,
    attempts: 0,
    lastError: null,
    ...overrides,
  };
}

describe("createReplayGuard", () => {
  it("runs the task once when three screens ask for a sync at once", async () => {
    const guard = createReplayGuard();
    let runs = 0;
    let release: () => void = () => {};
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });

    const task = async () => {
      runs += 1;
      await gate;
      return runs;
    };

    // Three mounted screens all ask for a sync in the same tick.
    const first = guard.run(task);
    const second = guard.run(task);
    const third = guard.run(task);
    release();
    const results = await Promise.all([first, second, third]);

    expect(runs).toBe(1);
    expect(results.filter((result) => result !== null)).toHaveLength(1);
  });

  it("allows the next replay once the first one finished", async () => {
    const guard = createReplayGuard();
    expect(await guard.run(async () => "first")).toBe("first");
    expect(guard.isRunning()).toBe(false);
    expect(await guard.run(async () => "second")).toBe("second");
  });

  it("releases the guard when the task throws", async () => {
    const guard = createReplayGuard();
    await expect(
      guard.run(async () => {
        throw new Error("network down");
      }),
    ).rejects.toThrow("network down");
    expect(guard.isRunning()).toBe(false);
  });
});

describe("queuedEntriesFrom", () => {
  it("returns the entries the server has not accepted yet", () => {
    const entries = queuedEntriesFrom([
      item({ id: "pending" }),
      item({ id: "failed", status: "failed" }),
    ]);

    expect(entries.map((entry) => entry.id)).toEqual(["pending", "failed"]);
    expect(entries[0].amount).toBe(500);
    expect(entries[0].type).toBe("credit");
    expect(entries[0].pending).toBe(true);
    expect(entries[1].pending).toBe(true);
  });

  it("keeps a synced entry until the server list holds it", () => {
    const entries = queuedEntriesFrom([
      item({
        id: "synced",
        status: "synced",
        syncedAt: "x",
        payload: {
          id: "synced",
          customerId: "customer-1",
          amount: 500,
          type: "credit",
        },
      }),
    ]);

    expect(entries.map((entry) => entry.id)).toEqual(["synced"]);
    expect(entries[0].pending).toBe(false);
  });

  it("leaves out an entry the server published under another id", () => {
    const entries = queuedEntriesFrom([
      item({ id: "legacy", status: "synced", syncedAt: "x" }),
    ]);

    expect(entries).toHaveLength(0);
  });
});

describe("pendingCustomersFrom", () => {
  it("returns customers that are still waiting to sync", () => {
    const customers = pendingCustomersFrom([
      item({
        id: "customer-1",
        kind: "customer.create",
        payload: { name: "Ramesh", phone: "+91 99999 00001" },
      }),
    ]);

    expect(customers).toEqual([
      { id: "customer-1", name: "Ramesh", phone: "+91 99999 00001" },
    ]);
  });

  it("does not list a customer twice once it is synced", () => {
    const customers = pendingCustomersFrom([
      item({
        id: "customer-1",
        kind: "customer.create",
        status: "synced",
        syncedAt: "x",
        payload: { name: "Ramesh", phone: "+91 99999 00001" },
      }),
    ]);

    expect(customers).toHaveLength(0);
  });
});

describe("one submission, one outcome", () => {
  it("surfaces the rejection when the server refuses the queued write", () => {
    const queued = item({ id: "tx-1" });
    const replayed = applyOutcome([queued], {
      id: "tx-1",
      result: "failed",
      error: "Validation failed · amount must be a whole number of rupees",
    });

    expect(submissionRejection(replayed, "tx-1")).toBe(
      "Validation failed · amount must be a whole number of rupees",
    );
  });

  it("surfaces nothing while the device is offline", () => {
    const queued = item({ id: "tx-1" });

    expect(submissionRejection([queued], "tx-1")).toBeNull();
  });

  it("surfaces nothing once the server accepted the write", () => {
    const replayed = applyOutcome([item({ id: "tx-1" })], {
      id: "tx-1",
      result: "synced",
      syncedAt: "2026-01-02T00:00:00.000Z",
    });

    expect(submissionRejection(replayed, "tx-1")).toBeNull();
  });
});
