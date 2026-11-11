import { describe, expect, it } from "bun:test";
import { buildUpiUri, isValidUpiId } from "./upi";

describe("buildUpiUri", () => {
  it("omits the amount for a shop-wide QR", () => {
    const uri = buildUpiUri({
      upiId: "shop@okhdfcbank",
      payeeName: "Ramesh Kirana",
      note: "Khata payment",
    });
    expect(uri).toContain("pa=shop%40okhdfcbank");
    expect(uri).toContain("pn=Ramesh%20Kirana");
    expect(uri).toContain("cu=INR");
    expect(uri).not.toContain("am=");
  });

  it("includes a two-decimal amount for a customer QR", () => {
    const uri = buildUpiUri({
      upiId: "shop@okhdfcbank",
      payeeName: "Ramesh Kirana",
      amount: 1200,
    });
    expect(uri).toContain("am=1200.00");
  });
});

describe("isValidUpiId", () => {
  it("accepts name@bank and rejects missing handles", () => {
    expect(isValidUpiId("shop@okhdfcbank")).toBe(true);
    expect(isValidUpiId("shop")).toBe(false);
    expect(isValidUpiId("shop@")).toBe(false);
  });
});
