import { z } from "zod";

export type JsonSchema = Record<string, unknown>;

export type Parameter = {
  name: string;
  in: "path" | "query" | "header" | "cookie";
  required?: boolean;
  description?: string;
  schema: JsonSchema;
};

function isPlainObject(value: unknown): value is JsonSchema {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeProperties(properties: unknown): unknown {
  if (!isPlainObject(properties)) return properties;
  const normalized: JsonSchema = {};
  for (const [key, value] of Object.entries(properties)) {
    normalized[key] = isPlainObject(value) ? normalizeJsonSchema(value) : value;
  }
  return normalized;
}

/**
 * Convert Zod's draft-07 JSON Schema into the OpenAPI 3.0 dialect: 3.0 has no
 * `null` type, no `const`, and uses boolean `exclusiveMinimum`/`exclusiveMaximum`.
 */
export function normalizeJsonSchema(input: JsonSchema): JsonSchema {
  let out: JsonSchema = { ...input };

  delete out.$schema;
  delete out.$defs;

  if ("const" in out) {
    out.enum = [out.const];
    delete out.const;
  }

  if (Array.isArray(out.type) && out.type.includes("null")) {
    const types = (out.type as unknown[]).filter((type) => type !== "null");
    if (types.length === 1) {
      out.type = types[0];
      out.nullable = true;
    } else if (types.length > 1) {
      out.type = types;
      out.nullable = true;
    }
  }

  if (Array.isArray(out.anyOf)) {
    const branches = out.anyOf as unknown[];
    const nonNull = branches.filter(
      (branch) => !(isPlainObject(branch) && branch.type === "null"),
    );
    if (nonNull.length !== branches.length) {
      if (nonNull.length === 1 && isPlainObject(nonNull[0])) {
        out = { ...nonNull[0], ...out, nullable: true };
        delete out.anyOf;
      } else {
        out.anyOf = nonNull;
        out.nullable = true;
      }
    }
  }

  if (typeof out.exclusiveMinimum === "number") {
    out.minimum = out.exclusiveMinimum;
    out.exclusiveMinimum = true;
  }
  if (typeof out.exclusiveMaximum === "number") {
    out.maximum = out.exclusiveMaximum;
    out.exclusiveMaximum = true;
  }

  if ("properties" in out) out.properties = normalizeProperties(out.properties);
  if (isPlainObject(out.items)) out.items = normalizeJsonSchema(out.items);
  if (isPlainObject(out.additionalProperties)) {
    out.additionalProperties = normalizeJsonSchema(out.additionalProperties);
  }
  for (const keyword of ["anyOf", "oneOf", "allOf"]) {
    if (Array.isArray(out[keyword])) {
      out[keyword] = (out[keyword] as unknown[])
        .filter((branch) => !(isPlainObject(branch) && branch.type === "null"))
        .map((branch) =>
          isPlainObject(branch) ? normalizeJsonSchema(branch) : branch,
        );
    }
  }

  return out;
}

export function zodToOpenApiSchema(schema: z.ZodType): JsonSchema {
  const json = z.toJSONSchema(schema, {
    target: "draft-7",
    io: "input",
  }) as JsonSchema;
  return normalizeJsonSchema(json);
}

/**
 * Build OpenAPI query parameters from the same Zod schema a handler parses, so
 * names, types, defaults, and required flags cannot drift.
 */
export function queryParameters(
  schema: z.ZodType,
  overrides: Record<string, JsonSchema> = {},
): Parameter[] {
  const json = z.toJSONSchema(schema, {
    target: "draft-7",
    io: "input",
  }) as JsonSchema;

  const properties = (json.properties ?? {}) as Record<string, JsonSchema>;
  const required = new Set((json.required ?? []) as string[]);

  return Object.entries(properties).map(([name, property]) => ({
    name,
    in: "query" as const,
    required: required.has(name),
    schema: { ...normalizeJsonSchema(property), ...overrides[name] },
  }));
}

export function pathParameter(
  name: string,
  description: string,
  format = "uuid",
): Parameter {
  return {
    name,
    in: "path",
    required: true,
    description,
    schema: { type: "string", format },
  };
}

export function ref(name: string): JsonSchema {
  return { $ref: `#/components/schemas/${name}` };
}

export function jsonContent(schema: JsonSchema): JsonSchema {
  return { "application/json": { schema } };
}

export function jsonResponse(
  description: string,
  schema?: JsonSchema,
): JsonSchema {
  return schema
    ? { description, content: jsonContent(schema) }
    : { description };
}

export const ERROR_DESCRIPTIONS: Record<number, string> = {
  400: "Validation failed",
  401: "Unauthenticated",
  404: "Resource not found",
  410: "Feature removed",
  500: "Internal server error",
};

export function errorResponses(...codes: number[]): Record<string, JsonSchema> {
  const responses: Record<string, JsonSchema> = {};
  for (const code of codes) {
    responses[String(code)] = jsonResponse(
      ERROR_DESCRIPTIONS[code] ?? "Error",
      ref("Error"),
    );
  }
  return responses;
}
