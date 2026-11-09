import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import SwaggerParser from "@apidevtools/swagger-parser";
import {
  buildDocument,
  serializeDocument,
} from "./openapi/build-document";
import type { JsonSchema } from "./openapi/schema";

const scriptDir = dirname(fileURLToPath(import.meta.url));
export const OUTPUT_PATH = resolve(scriptDir, "../openapi.yaml");

export async function validateDocument(document: JsonSchema): Promise<void> {
  try {
    // Validate a clone: SwaggerParser may annotate the object it is given.
    await SwaggerParser.validate(structuredClone(document) as never);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Generated OpenAPI document is invalid:\n${message}`);
  }
}

export function firstDifference(
  committed: string,
  generated: string,
): { line: number; committed: string; generated: string } | null {
  const actual = committed.split("\n");
  const expected = generated.split("\n");
  const length = Math.max(actual.length, expected.length);

  for (let index = 0; index < length; index += 1) {
    if (actual[index] !== expected[index]) {
      return {
        line: index + 1,
        committed: actual[index] ?? "(end of file)",
        generated: expected[index] ?? "(end of file)",
      };
    }
  }

  return null;
}

async function main(): Promise<void> {
  const check = process.argv.includes("--check");
  const document = buildDocument();

  await validateDocument(document);

  const generated = serializeDocument(document);

  if (!check) {
    await Bun.write(OUTPUT_PATH, generated);
    console.log(
      `Wrote ${OUTPUT_PATH} (${Object.keys(document.paths as object).length} paths)`,
    );
    return;
  }

  const committed = await Bun.file(OUTPUT_PATH)
    .text()
    .catch(() => null);

  if (committed === null) {
    console.error(
      `OpenAPI spec is missing: ${OUTPUT_PATH}\n` +
        "Run `bun run openapi:generate` to create it.",
    );
    process.exitCode = 1;
    return;
  }

  const difference = firstDifference(committed, generated);
  if (difference) {
    console.error(
      `OpenAPI spec is out of date: ${OUTPUT_PATH}\n` +
        `First difference at line ${difference.line}:\n` +
        `  committed: ${difference.committed}\n` +
        `  generated: ${difference.generated}\n` +
        "Run `bun run openapi:generate` to update it.",
    );
    process.exitCode = 1;
    return;
  }

  console.log(`OpenAPI spec is up to date: ${OUTPUT_PATH}`);
}

if (import.meta.main) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
