import { describe, expect, test } from "bun:test";
import { formatApiError, toApiError } from "./api-error";

function apiFailure(body: unknown, status = 400) {
  return {
    response: {
      status,
      statusText: "Bad Request",
      data: body,
    },
    message: "Request failed",
  };
}

describe("toApiError", () => {
  test("reads the envelope error and its field details", () => {
    const error = toApiError(
      apiFailure({
        error: "Validation failed",
        details: { amount: ["amount must be a whole number of rupees"] },
      }),
    );

    expect(error.message).toBe("Validation failed");
    expect(error.details?.amount).toEqual([
      "amount must be a whole number of rupees",
    ]);
    expect(error.status).toBe(400);
  });
});

describe("formatApiError", () => {
  test("appends the field detail to the envelope error", () => {
    const message = formatApiError(
      apiFailure({
        error: "Validation failed",
        details: { amount: ["amount must be a whole number of rupees"] },
      }),
    );

    expect(message).toBe(
      "Validation failed · amount must be a whole number of rupees",
    );
  });

  test("names the field when the detail does not name it", () => {
    const message = formatApiError(
      apiFailure({
        error: "Validation failed",
        details: { amount: ["Invalid input"] },
      }),
    );

    expect(message).toBe("Validation failed · amount: Invalid input");
  });

  test("keeps the bare error when there are no details", () => {
    const message = formatApiError(
      apiFailure({ error: "Customer not found" }, 404),
    );

    expect(message).toBe("Customer not found");
  });

  test("keeps the bare error when the details are empty", () => {
    const message = formatApiError(
      apiFailure({ error: "Validation failed", details: { amount: [] } }),
    );

    expect(message).toBe("Validation failed");
  });

  test("falls back to a generic message for a non-envelope failure", () => {
    expect(formatApiError(new Error("Network down"))).toBe("Network down");
  });
});
