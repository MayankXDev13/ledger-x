import { readFileSync } from "node:fs";
import { Client } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";

const m = readFileSync("../../.env", "utf8").match(/DATABASE_URL\s*=\s*(.+)/);
if (!m) throw new Error("DATABASE_URL not found in root .env");
const url = m[1].trim().replace(/^['"]|['"]$/g, "");

const client = new Client({ connectionString: url });
await client.connect();
const db = drizzle(client);
await migrate(db, { migrationsFolder: "./drizzle" });
console.log("migrate() applied successfully");
await client.end();
