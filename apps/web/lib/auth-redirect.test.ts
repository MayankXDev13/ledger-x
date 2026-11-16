import { describe, expect, it } from "bun:test";
import { googleRedirectURL } from "./auth-redirect";
import { LANDING_ROUTE } from "./routes";

describe("googleRedirectURL", () => {
  it("keeps the success target on the canonical landing route", () => {
    const url = new URL(
      googleRedirectURL("http://localhost:3000", "http://localhost:8787"),
    );

    expect(url.pathname).toBe("/api/auth/redirect/google");
    expect(url.searchParams.get("callbackURL")).toBe(
      `http://localhost:3000${LANDING_ROUTE}`,
    );
  });

  it("adds the login page as the error target", () => {
    const url = new URL(
      googleRedirectURL("https://app.example.com", "https://api.example.com"),
    );

    expect(url.searchParams.get("errorCallbackURL")).toBe(
      "https://app.example.com/login",
    );
  });
});
