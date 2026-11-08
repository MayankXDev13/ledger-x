import { describe, expect, it } from "bun:test";
import {
  COOLDOWN_THRESHOLD,
  cooldownMs,
  isLocked,
  isValidPin,
  recordFailure,
  shouldRelock,
} from "./app-lock-core";

describe("isValidPin", () => {
  it("accepts 4-6 digits", () => {
    expect(isValidPin("1234")).toBe(true);
    expect(isValidPin("000000")).toBe(true);
    expect(isValidPin("123")).toBe(false);
    expect(isValidPin("1234567")).toBe(false);
    expect(isValidPin("12a4")).toBe(false);
    expect(isValidPin("")).toBe(false);
  });
});

describe("cooldown", () => {
  it("has no cooldown before the fifth failure", () => {
    for (let n = 1; n < COOLDOWN_THRESHOLD; n += 1) {
      expect(cooldownMs(n)).toBe(0);
    }
  });

  it("grows exponentially from the fifth failure", () => {
    expect(cooldownMs(5)).toBe(30_000);
    expect(cooldownMs(6)).toBe(60_000);
    expect(cooldownMs(7)).toBe(120_000);
  });
});

describe("recordFailure / isLocked", () => {
  it("locks after repeated wrong PINs", () => {
    const now = 1_000_000;
    let state = { consecutiveFailures: 0, lockedUntil: null as number | null };

    for (let i = 0; i < COOLDOWN_THRESHOLD; i += 1) {
      state = recordFailure(state, now);
    }

    expect(state.consecutiveFailures).toBe(COOLDOWN_THRESHOLD);
    expect(isLocked(state, now)).toBe(true);
    expect(isLocked(state, now + 30_001)).toBe(false);
  });

  it("does not lock early failures", () => {
    const now = 1_000_000;
    const state = recordFailure(
      { consecutiveFailures: 0, lockedUntil: null },
      now,
    );
    expect(isLocked(state, now)).toBe(false);
  });
});

describe("shouldRelock", () => {
  const config = { autoLockMs: 60_000 };

  it("re-locks after the timeout", () => {
    expect(shouldRelock(1000, 61_000, config)).toBe(true);
  });

  it("stays unlocked inside the window", () => {
    expect(shouldRelock(1000, 60_999, config)).toBe(false);
  });

  it("never re-locks when the app stayed foregrounded", () => {
    expect(shouldRelock(null, 999_999, config)).toBe(false);
  });
});
