import { describe, expect, test } from "bun:test";
import {
  DEFAULT_FEATURE_FLAGS,
  FEATURE_FLAG_KEYS,
  isFeatureEnabled,
} from "./feature-flags";

describe("isFeatureEnabled", () => {
  test("reports a flag that is on", () => {
    expect(isFeatureEnabled({ collection: true }, "collection")).toBe(true);
  });

  test("treats a flag that is off as off", () => {
    expect(isFeatureEnabled({ collection: false }, "collection")).toBe(false);
  });

  test("treats an unknown flag as off", () => {
    expect(isFeatureEnabled({}, "collection")).toBe(false);
  });

  test("falls back to enabled when the registry cannot be read", () => {
    expect(isFeatureEnabled(undefined, "collection")).toBe(true);
    expect(isFeatureEnabled(undefined, "upi_collection")).toBe(true);
  });
});

describe("the default registry", () => {
  test("carries every shipped flag, enabled", () => {
    for (const key of FEATURE_FLAG_KEYS) {
      expect(DEFAULT_FEATURE_FLAGS[key]).toBe(true);
    }
  });
});
