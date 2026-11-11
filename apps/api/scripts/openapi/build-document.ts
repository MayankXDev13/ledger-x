import YAML from "yaml";
import {
  discoverRoutes,
  METHOD_ORDER,
  routeKey,
  type DiscoveredRoute,
} from "./discover-routes";
import { MODELS } from "./models";
import { OPERATIONS, type OperationDefinition } from "./operations";
import {
  jsonContent,
  zodToOpenApiSchema,
  type JsonSchema,
} from "./schema";

export const OPENAPI_VERSION = "3.0.3";

type PathItem = Record<string, JsonSchema>;

function toOpenApiPath(path: string): string {
  return path.replace(/:([A-Za-z0-9_]+)/g, "{$1}");
}

function methodForOpenApi(method: string): string {
  // `app.all` is registered as ALL. OpenAPI has no "all" operation, so the
  // Better Auth wildcard is documented once as a GET; its description states
  // that every method is handled.
  return method === "ALL" ? "get" : method.toLowerCase();
}

function renderOperation(definition: OperationDefinition): JsonSchema {
  const operation: JsonSchema = {
    summary: definition.summary,
    tags: definition.tags,
  };

  if (definition.description) {
    operation.description = definition.description;
  }

  if (definition.parameters && definition.parameters.length > 0) {
    operation.parameters = definition.parameters;
  }

  if (definition.requestBody) {
    operation.requestBody = {
      required: definition.requestBody.required ?? true,
      content: jsonContent(
        zodToOpenApiSchema(definition.requestBody.schema),
      ),
    };
  }

  if (definition.auth) {
    operation.security = [{ bearerAuth: [] }];
  }

  operation.responses = definition.responses;

  return operation;
}

function sortKeys<T>(
  value: Record<string, T>,
  compare: (a: string, b: string) => number,
): Record<string, T> {
  const sorted: Record<string, T> = {};
  for (const key of Object.keys(value).sort(compare)) {
    sorted[key] = value[key];
  }
  return sorted;
}

function methodRank(method: string): number {
  const index = METHOD_ORDER.indexOf(method.toUpperCase());
  return index === -1 ? METHOD_ORDER.length : index;
}

function assertRegistryMatchesRoutes(routes: DiscoveredRoute[]): void {
  const discovered = new Set(routes.map(routeKey));
  const registered = new Set(Object.keys(OPERATIONS));

  const missing = [...discovered].filter((key) => !registered.has(key)).sort();
  if (missing.length > 0) {
    throw new Error(
      `Missing OpenAPI operation metadata for: ${missing.join(", ")}`,
    );
  }

  const stale = [...registered].filter((key) => !discovered.has(key)).sort();
  if (stale.length > 0) {
    throw new Error(
      `OpenAPI operation metadata has no matching route: ${stale.join(", ")}`,
    );
  }
}

export function buildDocument(
  routes: DiscoveredRoute[] = discoverRoutes(),
): JsonSchema {
  assertRegistryMatchesRoutes(routes);

  const paths: Record<string, PathItem> = {};

  for (const route of routes) {
    const path = toOpenApiPath(route.path);
    const definition = OPERATIONS[routeKey(route)];
    const pathItem = paths[path] ?? (paths[path] = {});
    pathItem[methodForOpenApi(route.method)] = renderOperation(definition);
  }

  const sortedPaths: Record<string, PathItem> = {};
  for (const path of Object.keys(paths).sort()) {
    const item = paths[path];
    const sortedItem: PathItem = {};
    for (const method of Object.keys(item).sort(
      (a, b) =>
        methodRank(a) - methodRank(b) || a.localeCompare(b),
    )) {
      sortedItem[method] = item[method];
    }
    sortedPaths[path] = sortedItem;
  }

  return {
    openapi: OPENAPI_VERSION,
    info: {
      title: "Ledger-X API",
      version: "1.0.0",
      description:
        "Generated OpenAPI specification for the Ledger-X server routes. " +
        "Regenerate with `bun run openapi:generate`.",
    },
    servers: [
      {
        url: "http://localhost:8787",
        description: "Local development server",
      },
      {
        url: "https://api.ledgex.mayankxdev.shop",
        description: "Production API",
      },
    ],
    tags: [
      { name: "auth", description: "Authentication and session endpoints" },
      { name: "customers", description: "Customer records" },
      { name: "transactions", description: "Credits and payments" },
      { name: "dashboard", description: "Dashboard aggregates" },
      { name: "books", description: "Ledger books" },
      { name: "exports", description: "CSV data exports" },
      { name: "account", description: "Account archive and deletion" },
      { name: "statements", description: "Customer statements" },
      { name: "settings", description: "UPI and onboarding settings" },
      { name: "collection", description: "Outstanding receivables" },
      { name: "feature-flags", description: "Administrator-owned feature flags" },
      { name: "sample-data", description: "Demo data management" },
      { name: "audit-logs", description: "Audit trail" },
    ],
    paths: sortedPaths,
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          description:
            "Better Auth session token passed as `Authorization: Bearer <token>`.",
        },
      },
      schemas: sortKeys(MODELS, (a, b) => a.localeCompare(b)),
    },
  };
}

export function serializeDocument(document: JsonSchema): string {
  const text = YAML.stringify(document, {
    lineWidth: 0,
    sortMapEntries: false,
  });
  return text.endsWith("\n") ? text : `${text}\n`;
}
