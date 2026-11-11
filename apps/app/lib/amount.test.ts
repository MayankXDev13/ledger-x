import { describe, expect, it } from "bun:test";
import { parseWholeRupeAmount, WHOLE_RUPE_ERROR } from "./amount";

describe("parseWholeRupeAmount", () => {
  it("accepts a whole rupee amount", () => {
    expect(parseWholeRupeAmount("1250")).toEqual({ ok: true, amount: 1250 });
  });

  it("accepts a whole amount with surrounding space", () => {
    expect(parseWholeRupeAmount(" 1250 ")).toEqual({ ok: true, amount: 1250 });
  });

  it("refuses a fractional amount and names the unit", () => {
    expect(parseWholeRupeAmount("1250.5")).toEqual({
      ok: false,
      error: WHOLE_RUPE_ERROR,
    });
  });

  it("refuses a fractional amount under one rupee", () => {
    expect(parseWholeRupeAmount("0.5")).toEqual({
      ok: false,
      error: WHOLE_RUPE_ERROR,
    });
  });

  it("refuses an empty amount", () => {
    expect(parseWholeRupeAmount("")).toEqual({
      ok: false,
      error: "Amount is required",
    });
  });

  it("refuses an amount that is not a number", () => {
    expect(parseWholeRupeAmount("abc")).toEqual({
      ok: false,
      error: "Please enter a valid amount",
    });
  });

  it("refuses zero and negative amounts", () => {
    expect(parseWholeRupeAmount("0")).toEqual({
      ok: false,
      error: "Please enter a valid amount",
    });
    expect(parseWholeRupeAmount("-500")).toEqual({
      ok: false,
      error: "Please enter a valid amount",
    });
  });
});
