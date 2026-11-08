import { describe, expect, it } from "bun:test";
import {
  buildUpiQrPayload,
  buildUpiUri,
  isValidUpiId,
} from "./upi";

describe("UPI intent builder", () => {
  it("encodes the payee and a two-decimal amount", () => {
    const uri = buildUpiUri({
      upiId: "ramesh@okhdfcbank",
      payeeName: "Ramesh Kirana",
      amount: 1250,
    });

    expect(uri).toContain("pa=ramesh%40okhdfcbank");
    expect(uri).toContain("pn=Ramesh%20Kirana");
    expect(uri).toContain("am=1250.00");
    expect(uri).toContain("cu=INR");
    expect(uri.startsWith("upi://pay?")).toBe(true);
  });

  it("encodes the note when present", () => {
    const uri = buildUpiUri({
      upiId: "shop@upi",
      payeeName: "Shop",
      amount: 5,
      note: "Khata payment",
    });

    expect(uri).toContain("am=5.00");
    expect(uri).toContain("tn=Khata%20payment");
  });

  it("uses the same URI as the QR payload", () => {
    const request = {
      upiId: "shop@upi",
      payeeName: "Shop",
      amount: 999,
      note: "Balance",
    };

    expect(buildUpiQrPayload(request)).toBe(buildUpiUri(request));
  });

  it("validates VPA shape", () => {
    expect(isValidUpiId("ramesh@okhdfcbank")).toBe(true);
    expect(isValidUpiId("not-a-vpa")).toBe(false);
    expect(isValidUpiId("a@b")).toBe(false);
  });
});
