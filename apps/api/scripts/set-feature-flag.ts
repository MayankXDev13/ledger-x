// Flip a feature flag for this deployment.
//
//   bun scripts/set-feature-flag.ts --key collection --enable false
//   bun scripts/set-feature-flag.ts --key statements --label "Statements" --description "..."
//
// The flags live in the database, so the administrator changes them without a
// redeploy and without a client release. A signed-in user can never change a
// flag: the API exposes the registry read-only.
import { readFileSync } from "node:fs";
import { Client } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq } from "drizzle-orm";
import { featureFlags } from "../src/db/schema";

function arg(name: string): string | undefined {
  const index = process.argv.indexOf(`--${name}`);
  if (index === -1) return undefined;
  const value = process.argv[index + 1];
  return value && !value.startsWith("--") ? value : undefined;
}

const key = arg("key");
const enable = arg("enable");
const label = arg("label");
const description = arg("description");

if (!key) {
  console.error(
    'Usage: bun scripts/set-feature-flag.ts --key <flag> [--enable <true|false>] [--label <text>] [--description <text>]',
  );
  process.exit(1);
}

if (enable !== undefined && enable !== "true" && enable !== "false") {
  console.error(`--enable must be "true" or "false", got "${enable}"`);
  process.exit(1);
}

const m = readFileSync("../../.env", "utf8").match(/DATABASE_URL\s*=\s*(.+)/);
if (!m) throw new Error("DATABASE_URL not found in root .env");
const url = m[1].trim().replace(/^['"]|['"]$/g, "");

const client = new Client({ connectionString: url });
await client.connect();

try {
  const db = drizzle(client);
  const existing = await db
    .select()
    .from(featureFlags)
    .where(eq(featureFlags.key, key))
    .limit(1);

  if (existing.length === 0) {
    if (!label) {
      console.error(`Unknown flag "${key}". Registered flags:`);
      const all = await db.select().from(featureFlags);
      for (const row of all) {
        console.error(`  ${row.key} — ${row.label}`);
      }
      console.error(
        "Add a new flag with --label and --description.",
      );
      process.exitCode = 1;
    } else {
      const [row] = await db
        .insert(featureFlags)
        .values({
          key,
          enabled: enable === undefined ? true : enable === "true",
          label,
          description: description ?? "",
        })
        .returning();
      console.log(`Registered "${row.key}" (${row.label}): ${row.enabled}`);
    }
  } else {
    const values: Record<string, unknown> = { updatedAt: new Date() };
    if (enable !== undefined) values.enabled = enable === "true";
    if (label !== undefined) values.label = label;
    if (description !== undefined) values.description = description;

    const [row] = await db
      .update(featureFlags)
      .set(values)
      .where(eq(featureFlags.key, key))
      .returning();

    console.log(
      `"${row.key}" (${row.label}) is now ${row.enabled ? "enabled" : "disabled"}`,
    );
  }
} finally {
  await client.end();
}
