import { describe, expect, test } from "bun:test";
import { transactionSchema } from "./validation";

function amountError(value: unknown) {
  const result = transactionSchema.safeParse({
    amount: value,
    transactionType: "credit",
  });
  if (result.success) return undefined;
  return result.error.flatten().fieldErrors.amount?.[0];
}

describe("transaction amount validation", () => {
  test("a whole rupee amount is accepted", () => {
    expect(amountError(1250)).toBeUndefined();
  });

  test("a fractional rupee amount is refused with the unit named", () => {
    expect(amountError(1250.5)).toBe("Amount must be a whole number of rupees");
  });

  test("a fractional amount under one rupee is refused", () => {
    expect(amountError(0.5)).toBe("Amount must be a whole number of rupees");
  });

  test("zero is refused", () => {
    expect(amountError(0)).toBe("Amount must be at least 1 rupee");
  });

  test("a negative amount is refused", () => {
    expect(amountError(-500)).toBe("Amount must be at least 1 rupee");
  });

  test("an empty amount asks for an amount", () => {
    expect(amountError(undefined)).toBe("Enter an amount");
  });
});
