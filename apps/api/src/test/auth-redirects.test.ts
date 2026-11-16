import { describe, expect, it } from "bun:test";
import type { Bindings } from "../types/hono";
import {
  browserLoginURL,
  resolveErrorCallbackURL,
  trustedOrigins,
} from "../lib/auth-redirects";

function env(overrides: Partial<Bindings> = {}): Bindings {
  return { HYPERDRIVE: {} as Hyperdrive, ...overrides } as Bindings;
}

describe("browserLoginURL", () => {
  it("uses the configured WEB_APP_URL when it is an http(s) origin", () => {
    const result = browserLoginURL(
      env({
        WEB_APP_URL: "https://app.example.com",
        TRUSTED_ORIGINS: "http://localhost:3000",
      }),
    );

    expect(result).toBe("https://app.example.com/login");
  });

  it("falls back to the first http(s) trusted origin, skipping deep-link schemes", () => {
    const result = browserLoginURL(
      env({
        TRUSTED_ORIGINS: "ledgerx://,exp://,http://localhost:3000,https://app.example.com",
      }),
    );

    expect(result).toBe("http://localhost:3000/login");
  });

  it("rejects non-http(s) WEB_APP_URL values and falls back", () => {
    const result = browserLoginURL(
      env({
        WEB_APP_URL: "ledgerx://login",
        TRUSTED_ORIGINS: "https://app.example.com",
      }),
    );

    expect(result).toBe("https://app.example.com/login");
  });

  it("uses the local default when no usable origin is configured", () => {
    expect(browserLoginURL(env({ TRUSTED_ORIGINS: "ledgerx://" }))).toBe(
      "http://localhost:3000/login",
    );
  });
});

describe("trustedOrigins", () => {
  it("trims entries and keeps non-browser schemes for CORS/Better Auth", () => {
    expect(trustedOrigins(env({ TRUSTED_ORIGINS: " a , ledgerx:// , , b " }))).toEqual(
      ["a", "ledgerx://", "b"],
    );
  });
});

describe("resolveErrorCallbackURL", () => {
  const trustedEnv = env({
    WEB_APP_URL: "https://app.example.com",
    TRUSTED_ORIGINS: "https://app.example.com,http://localhost:3000,ledgerx://",
  });

  it("honours an absolute http(s) URL whose origin is trusted", () => {
    const target = "https://app.example.com/recover";
    expect(resolveErrorCallbackURL(target, trustedEnv)).toBe(target);
  });

  it("falls back to login when the origin is not trusted", () => {
    expect(resolveErrorCallbackURL("https://evil.example.com/login", trustedEnv)).toBe(
      "https://app.example.com/login",
    );
  });

  it("falls back to login for non-http(s) or relative targets", () => {
    expect(resolveErrorCallbackURL("ledgerx://login", trustedEnv)).toBe(
      "https://app.example.com/login",
    );
    expect(resolveErrorCallbackURL("/login", trustedEnv)).toBe(
      "https://app.example.com/login",
    );
  });

  it("falls back to login when no target is provided", () => {
    expect(resolveErrorCallbackURL(undefined, trustedEnv)).toBe(
      "https://app.example.com/login",
    );
    expect(resolveErrorCallbackURL(null, trustedEnv)).toBe(
      "https://app.example.com/login",
    );
  });
});
