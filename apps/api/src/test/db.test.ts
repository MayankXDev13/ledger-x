import { describe, expect, it } from "bun:test";
import type { Context } from "hono";
import { createWithDb, type Db } from "../db";
import type { AppEnv } from "../types/hono";

type FakeClient = {
  connect: () => Promise<unknown>;
  end: () => Promise<void>;
};

function context(waits?: Promise<unknown>[]): Context<AppEnv> {
  const ctx: Record<string, unknown> = {
    env: {
      HYPERDRIVE: { connectionString: "postgres://example.test/db" },
    },
  };

  if (waits) {
    ctx.executionCtx = {
      waitUntil: (promise: Promise<unknown>) => waits.push(promise),
    };
  }

  return ctx as unknown as Context<AppEnv>;
}

function client(overrides: Partial<FakeClient> = {}): FakeClient {
  return {
    connect: async () => undefined,
    end: async () => undefined,
    ...overrides,
  };
}

const db = {} as Db;

describe("withDb", () => {
  it("closes the client after a successful handler", async () => {
    let ended = 0;
    const waits: Promise<unknown>[] = [];
    const run = createWithDb(
      () => client({ end: async () => void (ended += 1) }),
      () => db,
    );

    const result = await run(context(waits), async (provided) => {
      expect(provided).toBe(db);
      return 42;
    });
    await Promise.all(waits);

    expect(result).toBe(42);
    expect(ended).toBe(1);
  });

  it("closes the client when the handler throws", async () => {
    let ended = 0;
    const waits: Promise<unknown>[] = [];
    const run = createWithDb(
      () => client({ end: async () => void (ended += 1) }),
      () => db,
    );

    await expect(
      run(context(waits), async () => {
        throw new Error("boom");
      }),
    ).rejects.toThrow("boom");
    await Promise.all(waits);

    expect(ended).toBe(1);
  });

  it("closes the client when connect fails", async () => {
    let ended = 0;
    const waits: Promise<unknown>[] = [];
    const run = createWithDb(
      () =>
        client({
          connect: async () => {
            throw new Error("connect failed");
          },
          end: async () => void (ended += 1),
        }),
      () => db,
    );

    await expect(run(context(waits), async () => 1)).rejects.toThrow(
      "connect failed",
    );
    await Promise.all(waits);

    expect(ended).toBe(1);
  });

  it("awaits cleanup when there is no execution context", async () => {
    let ended = 0;
    const run = createWithDb(
      () => client({ end: async () => void (ended += 1) }),
      () => db,
    );

    await run(context(), async () => undefined);

    expect(ended).toBe(1);
  });
});
