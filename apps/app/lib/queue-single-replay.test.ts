import { describe, expect, it } from "bun:test";
import {
  createReplayGuard,
  pendingCustomersFrom,
  pendingEntriesFrom,
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

describe("pendingEntriesFrom", () => {
  it("returns entries that are still waiting to sync", () => {
    const entries = pendingEntriesFrom([
      item({ id: "pending" }),
      item({ id: "failed", status: "failed" }),
    ]);

    expect(entries.map((entry) => entry.id)).toEqual(["pending", "failed"]);
    expect(entries[0].amount).toBe(500);
    expect(entries[0].type).toBe("credit");
  });

  it("drops entries the server already accepted", () => {
    const entries = pendingEntriesFrom([
      item({ id: "synced", status: "synced", syncedAt: "x" }),
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
