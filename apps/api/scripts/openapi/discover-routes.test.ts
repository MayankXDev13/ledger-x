import { describe, expect, test } from "bun:test";
import { discoverRoutes, routeKey } from "./discover-routes";

const routes = discoverRoutes();
const keys = new Set(routes.map(routeKey));

describe("discoverRoutes", () => {
  test("includes representative mounted routes", () => {
    expect(keys.has("GET /customers")).toBe(true);
    expect(keys.has("POST /transactions")).toBe(true);
    expect(keys.has("GET /dashboard/analytics")).toBe(true);
    expect(keys.has("GET /exports/customers.csv")).toBe(true);
    expect(keys.has("DELETE /account")).toBe(true);
    expect(keys.has("ALL /api/auth/*")).toBe(true);
  });

  test("excludes middleware registrations", () => {
    expect(keys.has("ALL /customers/*")).toBe(false);
    expect(keys.has("ALL /*")).toBe(false);
    expect(keys.has("ALL /auth/me")).toBe(false);
  });

  test("excludes removed password-auth stubs", () => {
    expect(keys.has("POST /auth/login")).toBe(false);
    expect(keys.has("POST /auth/signup")).toBe(false);
    expect(keys.has("POST /auth/reset-password")).toBe(false);
  });

  test("every route is non-empty and unique", () => {
    expect(routes.length).toBeGreaterThan(0);

    for (const route of routes) {
      expect(route.method.length).toBeGreaterThan(0);
      expect(route.path.startsWith("/")).toBe(true);
    }

    expect(keys.size).toBe(routes.length);
  });
});
