import { describe, expect, it } from "bun:test";
import { LANDING_ROUTE, LOGIN_ROUTE, resolveEntryRoute } from "./routes";

describe("resolveEntryRoute", () => {
  it("sends a signed-in user to the landing route", () => {
    expect(
      resolveEntryRoute({
        loading: false,
        session: { user: { id: "u1" } },
      }),
    ).toBe(LANDING_ROUTE);
  });

  it("sends an anonymous user to the login route", () => {
    expect(resolveEntryRoute({ loading: false, session: null })).toBe(
      LOGIN_ROUTE,
    );
  });

  it("routes nowhere while the session is still unresolved", () => {
    expect(resolveEntryRoute({ loading: true, session: null })).toBeNull();
  });

  it("does not route to the login route for a signed-in user", () => {
    const route = resolveEntryRoute({
      loading: false,
      session: { user: { id: "u1" } },
    });
    expect(route).not.toBe(LOGIN_ROUTE);
  });
});
