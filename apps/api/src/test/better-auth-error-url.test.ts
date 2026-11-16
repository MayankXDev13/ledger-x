import { describe, expect, it } from "bun:test";
import { getAuth } from "../lib/better-auth";
import type { Bindings } from "../types/hono";

function authEnv(overrides: Partial<Bindings> = {}): Bindings {
  return {
    HYPERDRIVE: {
      connectionString: "postgres://user:pass@127.0.0.1:5432/ledgerx",
    } as Hyperdrive,
    GOOGLE_CLIENT_ID: "test-client-id",
    GOOGLE_CLIENT_SECRET: "test-client-secret",
    BETTER_AUTH_SECRET:
      "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
    BETTER_AUTH_URL: "http://localhost:8787",
    WEB_APP_URL: "http://localhost:3000",
    TRUSTED_ORIGINS: "http://localhost:3000",
    ...overrides,
  } as Bindings;
}

describe("Better Auth authentication error redirect", () => {
  it("sends a failed OAuth callback to the web login page, not the default error page", async () => {
    const { auth, release } = getAuth(authEnv());
    try {
      // A callback without `state` fails before any database access, so this
      // exercises the real Better Auth handler without a live connection.
      const response = await auth.handler(
        new Request("http://localhost:8787/api/auth/callback/google"),
      );
      const location = response.headers.get("location") ?? "";

      expect(response.status).toBeGreaterThanOrEqual(300);
      expect(response.status).toBeLessThan(400);
      expect(location).toContain("http://localhost:3000/login");
      expect(location).toContain("error=state_not_found");
      expect(location).not.toContain("http://localhost:8787/error");
    } finally {
      await release();
    }
  });

  it("falls back to the trusted origin when WEB_APP_URL is not configured", async () => {
    const { auth, release } = getAuth(
      authEnv({ WEB_APP_URL: undefined, TRUSTED_ORIGINS: "https://app.example.com" }),
    );
    try {
      const response = await auth.handler(
        new Request("http://localhost:8787/api/auth/callback/google"),
      );
      const location = response.headers.get("location") ?? "";

      expect(location).toContain("https://app.example.com/login");
      expect(location).not.toContain("http://localhost:8787/error");
    } finally {
      await release();
    }
  });
});
