import { describe, expect, it } from "bun:test";
import { ageBucket, agingSegments, agingTotal } from "./aging";

describe("ageBucket", () => {
  it("maps the 0-30 boundary", () => {
    expect(ageBucket(0)).toBe("0-30");
    expect(ageBucket(30)).toBe("0-30");
  });

  it("maps the 31-60 boundary", () => {
    expect(ageBucket(31)).toBe("31-60");
    expect(ageBucket(60)).toBe("31-60");
  });

  it("maps 60+", () => {
    expect(ageBucket(61)).toBe("60+");
  });

  it("returns null without an age", () => {
    expect(ageBucket(null)).toBeNull();
    expect(ageBucket(undefined)).toBeNull();
  });
});

describe("agingSegments", () => {
  it("sums to the total and assigns proportional fractions", () => {
    const buckets = { "0-30": 100, "31-60": 300, "60+": 600 };
    expect(agingTotal(buckets)).toBe(1000);
    const segments = agingSegments(buckets);
    expect(segments.map((segment) => segment.fraction)).toEqual([0.1, 0.3, 0.6]);
  });

  it("returns zero fractions when nothing is outstanding", () => {
    const segments = agingSegments({ "0-30": 0, "31-60": 0, "60+": 0 });
    expect(segments.every((segment) => segment.fraction === 0)).toBe(true);
  });
});
