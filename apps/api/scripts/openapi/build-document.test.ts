import { describe, expect, test } from "bun:test";
import * as validators from "../../src/validators";
import { buildDocument, serializeDocument } from "./build-document";
import { discoverRoutes, routeKey } from "./discover-routes";
import { zodToOpenApiSchema } from "./schema";

type Operation = Record<string, unknown>;

const document = buildDocument();
const paths = document.paths as Record<string, Record<string, Operation>>;

function openApiPath(path: string): string {
  return path.replace(/:([A-Za-z0-9_]+)/g, "{$1}");
}

function methodName(method: string): string {
  return method === "ALL" ? "get" : method.toLowerCase();
}

describe("buildDocument", () => {
  test("registry matches the discovered routes", () => {
    expect(() => buildDocument()).not.toThrow();
  });

  test("names a discovered route that has no metadata", () => {
    expect(() =>
      buildDocument([
        ...discoverRoutes(),
        { method: "GET", path: "/does-not-exist" },
      ]),
    ).toThrow(/GET \/does-not-exist/);
  });

  test("names metadata that no longer matches a route", () => {
    const routes = discoverRoutes().filter(
      (route) => routeKey(route) !== "POST /sample-data",
    );

    expect(() => buildDocument(routes)).toThrow(/POST \/sample-data/);
  });

  test("documents every discovered route exactly once", () => {
    for (const route of discoverRoutes()) {
      const operation =
        paths[openApiPath(route.path)]?.[methodName(route.method)];
      expect(operation, `${routeKey(route)} is missing`).toBeDefined();
    }
  });

  test("omits removed tag and password-auth endpoints", () => {
    expect(paths["/auth/login"]).toBeUndefined();
    expect(paths["/auth/signup"]).toBeUndefined();
    expect(paths["/auth/reset-password"]).toBeUndefined();
    expect(paths["/transaction-tags"]).toBeUndefined();
    expect(paths["/transactions/{id}/tags"]).toBeUndefined();
  });

  test("serializes deterministically", () => {
    expect(serializeDocument(buildDocument())).toBe(
      serializeDocument(buildDocument()),
    );
  });
});

describe("request schemas derived from validators", () => {
  test("createTransactionSchema matches the Zod validator", () => {
    const schema = zodToOpenApiSchema(validators.createTransactionSchema) as {
      type: string;
      required: string[];
      properties: Record<string, Record<string, unknown>>;
    };

    expect(schema.type).toBe("object");
    expect(schema.required).toEqual(["customerId", "amount", "type"]);
    expect(schema.properties.amount).toMatchObject({
      type: "integer",
      minimum: 0,
      exclusiveMinimum: true,
    });
    expect(schema.properties.type.enum).toEqual(["credit", "debit"]);
    expect(schema.properties.paymentMethod).toMatchObject({
      type: "string",
      enum: ["cash", "upi", "other"],
      nullable: true,
    });
  });

  test("query parameters come from the handler schemas", () => {
    const parameters = paths["/audit-logs"].get.parameters as Array<
      Record<string, unknown>
    >;
    const byName = new Map(parameters.map((parameter) => [parameter.name, parameter]));

    expect(byName.get("page")).toMatchObject({
      in: "query",
      schema: { type: "integer", default: 1 },
    });
    expect(byName.get("from")).toMatchObject({
      in: "query",
      schema: { type: "string", format: "date-time" },
    });
    expect(byName.get("pageSize")).toMatchObject({
      in: "query",
      schema: { type: "integer", default: 20 },
    });
  });
});

describe("security declarations", () => {
  test("declares the bearer scheme", () => {
    const components = document.components as {
      securitySchemes: Record<string, unknown>;
    };

    expect(components.securitySchemes.bearerAuth).toMatchObject({
      type: "http",
      scheme: "bearer",
    });
  });

  test("protected operations require bearer auth", () => {
    expect(paths["/customers"].get.security).toEqual([{ bearerAuth: [] }]);
    expect(paths["/transactions"].post.security).toEqual([{ bearerAuth: [] }]);
    expect(paths["/dashboard/analytics"].get.security).toEqual([
      { bearerAuth: [] },
    ]);
  });

  test("public operations do not require bearer auth", () => {
    expect(paths["/api/auth/redirect/google"].get.security).toBeUndefined();
    expect(paths["/api/auth/*"].get.security).toBeUndefined();
  });
});
