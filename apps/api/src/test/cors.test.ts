import { describe, expect, it } from "bun:test";
import { makeTestApp, requestApp } from "./helpers";

const TRUSTED = "https://web.example.com";
const env = { TRUSTED_ORIGINS: TRUSTED };

describe("CORS", () => {
  it("echoes a configured origin", async () => {
    const response = await requestApp(
      makeTestApp(),
      "/customers",
      { headers: { Origin: TRUSTED } },
      env,
    );

    expect(response.headers.get("access-control-allow-origin")).toBe(TRUSTED);
    expect(response.headers.get("access-control-allow-credentials")).toBe(
      "true",
    );
  });

  it("does not echo an unlisted origin", async () => {
    const response = await requestApp(
      makeTestApp(),
      "/customers",
      { headers: { Origin: "https://evil.example.com" } },
      env,
    );

    expect(response.headers.get("access-control-allow-origin")).toBeNull();
  });

  it("processes requests with no Origin header", async () => {
    const response = await requestApp(makeTestApp(), "/customers", {}, env);

    expect(response.status).toBe(401);
    expect(response.headers.get("access-control-allow-origin")).toBeNull();
  });

  it("answers preflight without requiring a token", async () => {
    const response = await requestApp(
      makeTestApp(),
      "/customers",
      {
        method: "OPTIONS",
        headers: {
          Origin: TRUSTED,
          "Access-Control-Request-Method": "GET",
          "Access-Control-Request-Headers": "Authorization",
        },
      },
      env,
    );

    expect(response.status).toBe(204);
    expect(response.headers.get("access-control-allow-origin")).toBe(TRUSTED);
    expect(response.headers.get("access-control-allow-methods")).toContain(
      "GET",
    );
    expect(response.headers.get("access-control-allow-headers")).toContain(
      "Authorization",
    );
  });
});
