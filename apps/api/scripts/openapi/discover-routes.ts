import { createApp } from "../../src/app";

export type DiscoveredRoute = {
  method: string;
  path: string;
};

/**
 * `app.use(...)` middleware registrations are exposed by Hono through
 * `app.routes` with the `ALL` method, exactly like the real Better Auth
 * wildcard handler (`ALL /api/auth/*`). These exact patterns are middleware
 * and must not become documented operations.
 */
export const MIDDLEWARE_ROUTES = new Set([
  "ALL /*",
  "ALL /customers/*",
  "ALL /transactions/*",
  "ALL /dashboard/*",
  "ALL /auth/me",
  "ALL /auth/logout",
  "ALL /audit-logs/*",
  "ALL /books/*",
  "ALL /exports/*",
  "ALL /account/*",
  "ALL /statements/*",
  "ALL /settings/*",
  "ALL /collection/*",
  "ALL /sample-data/*",
]);

export const METHOD_ORDER = ["GET", "POST", "PUT", "PATCH", "DELETE", "ALL"];

/**
 * Reserved paths that only return `410 Gone` after password authentication was
 * removed. They are mounted for stale clients but are not part of the current
 * API contract, so they must not appear in the generated document.
 */
export const REMOVED_ROUTES = new Set([
  "POST /auth/signup",
  "POST /auth/login",
  "POST /auth/request-reset",
  "POST /auth/reset-password",
  "POST /auth/change-password",
]);

function methodRank(method: string): number {
  const index = METHOD_ORDER.indexOf(method);
  return index === -1 ? METHOD_ORDER.length : index;
}

export function compareRoutes(a: DiscoveredRoute, b: DiscoveredRoute): number {
  if (a.path !== b.path) return a.path < b.path ? -1 : 1;
  const byMethod = methodRank(a.method) - methodRank(b.method);
  return byMethod !== 0 ? byMethod : a.method.localeCompare(b.method);
}

/**
 * Read the mounted routes from the live Hono app. Middleware registrations are
 * filtered out; everything else is a documented operation.
 */
export function discoverRoutes(
  app = createApp(),
): DiscoveredRoute[] {
  const seen = new Set<string>();
  const routes: DiscoveredRoute[] = [];

  for (const route of app.routes) {
    const method = route.method.toUpperCase();
    const path = route.path;
    const key = `${method} ${path}`;

    if (
      MIDDLEWARE_ROUTES.has(key) ||
      REMOVED_ROUTES.has(key) ||
      seen.has(key)
    ) {
      continue;
    }

    seen.add(key);
    routes.push({ method, path });
  }

  return routes.sort(compareRoutes);
}

export function routeKey(route: DiscoveredRoute): string {
  return `${route.method} ${route.path}`;
}
