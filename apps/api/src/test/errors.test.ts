import { describe, expect, it } from "bun:test";
import { FakeDb, authHeaders, fakeWithDb, makeTestApp, requestApp } from "./helpers";

describe("error envelope", () => {
  it("returns field details for a validation failure", async () => {
    const response = await requestApp(makeTestApp(), "/customers", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ name: "" }),
    });

    expect(response.status).toBe(400);
    const body = (await response.json()) as {
      error?: string;
      details?: Record<string, unknown>;
    };
    expect(body.error).toBe("Validation failed");
    expect(body.details).toHaveProperty("name");
    expect(body.details).toHaveProperty("phone");
  });

  it("returns JSON 404 for an unknown route", async () => {
    const response = await requestApp(makeTestApp(), "/not-a-route");

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: "Not found" });
  });

  it("returns the envelope for a missing resource", async () => {
    const db = new FakeDb();
    db.queueSelect();

    const response = await requestApp(
      makeTestApp({ withDb: fakeWithDb(db) }),
      "/customers/customer-1",
      { headers: authHeaders() },
    );

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: "Customer not found" });
  });

  it("contains an unexpected failure without leaking details", async () => {
    const app = makeTestApp();
    app.get("/boom", () => {
      throw new Error("postgres://user:password@secret/db");
    });

    const response = await requestApp(app, "/boom");
    const text = await response.text();

    expect(response.status).toBe(500);
    expect(JSON.parse(text)).toEqual({ error: "Internal server error" });
    expect(text).not.toContain("postgres://");
    expect(text).not.toContain("password");
  });
});
