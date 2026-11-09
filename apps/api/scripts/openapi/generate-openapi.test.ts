import { describe, expect, test } from "bun:test";
import { firstDifference, validateDocument } from "../generate-openapi";
import { buildDocument } from "./build-document";

describe("document validation", () => {
  test("accepts the generated document", async () => {
    await expect(validateDocument(buildDocument())).resolves.toBeUndefined();
  });

  test("rejects a broken document and names the invalid location", async () => {
    const broken = { openapi: "3.0.3", paths: {} };

    await expect(validateDocument(broken)).rejects.toThrow(
      /Generated OpenAPI document is invalid[\s\S]*info/i,
    );
  });
});

describe("drift comparison", () => {
  test("finds the first differing line", () => {
    const difference = firstDifference(
      "openapi: 3.0.3\ninfo:\n  title: Old\n",
      "openapi: 3.0.3\ninfo:\n  title: New\n",
    );

    expect(difference).toEqual({
      line: 3,
      committed: "  title: Old",
      generated: "  title: New",
    });
  });

  test("reports no difference for identical text", () => {
    expect(firstDifference("a\nb\n", "a\nb\n")).toBeNull();
  });
});
