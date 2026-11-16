import { describe, expect, test } from "bun:test";
import { TOTAL_OUTSTANDING_LABEL, oldestUnpaidLabel } from "./labels";

describe("labels", () => {
  test("the ledger total has one name", () => {
    expect(TOTAL_OUTSTANDING_LABEL).toBe("Total outstanding");
  });

  test("aging is written in full for zero, one and many days", () => {
    expect(oldestUnpaidLabel(0)).toBe("Oldest unpaid 0 days");
    expect(oldestUnpaidLabel(1)).toBe("Oldest unpaid 1 day");
    expect(oldestUnpaidLabel(38)).toBe("Oldest unpaid 38 days");
  });
});
