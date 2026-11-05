import { describe, expect, it } from "bun:test";
import { makeTestApp, requestApp } from "./helpers";

describe("contract harness", () => {
  it("returns a JSON envelope for unknown routes", async () => {
    const app = makeTestApp();
    const response = await requestApp(app, "/does-not-exist");

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: "Not found" });
  });
});
