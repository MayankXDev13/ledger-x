import { describe, expect, it } from "bun:test";
import { formatApiErrorMessage } from "./api-error";

describe("formatApiErrorMessage", () => {
  it("appends the field detail to the envelope error", () => {
    expect(
      formatApiErrorMessage("Validation failed", {
        amount: ["amount must be a whole number of rupees"],
      }),
    ).toBe("Validation failed · amount must be a whole number of rupees");
  });

  it("names the field when the detail does not name it", () => {
    expect(
      formatApiErrorMessage("Validation failed", { amount: ["Invalid input"] }),
    ).toBe("Validation failed · amount: Invalid input");
  });

  it("keeps the bare error when there are no details", () => {
    expect(formatApiErrorMessage("Customer not found")).toBe("Customer not found");
  });

  it("keeps the bare error when the details are empty", () => {
    expect(
      formatApiErrorMessage("Validation failed", { amount: [] }),
    ).toBe("Validation failed");
  });
});
