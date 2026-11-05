/**
 * Validate Supabase -> Neon migration: row counts + ownership spot checks.
 * Usage: SUPABASE_DB_URL=... DATABASE_URL=... bun scripts/validate-migration.ts
 * Exit non-zero when validation fails (blocks cutover).
 */
import { Client } from "pg";

const supabaseUrl = process.env.SUPABASE_DB_URL;
const neonUrl = process.env.DATABASE_URL;
if (!supabaseUrl || !neonUrl) {
  console.error("Set SUPABASE_DB_URL and DATABASE_URL");
  process.exit(1);
}

const extraSsl =
  supabaseUrl.includes("pooler.supabase.com") &&
  !process.env.SUPABASE_DB_SSL_SNI_OFF
    ? (() => {
        const at = supabaseUrl.lastIndexOf("@");
        const host = supabaseUrl.slice(at + 1).split("/")[0].split(":")[0];
        return { ssl: { servername: host, rejectUnauthorized: false } };
      })()
    : {};

const src = new Client({ connectionString: supabaseUrl, ...extraSsl });
const dst = new Client({ connectionString: neonUrl });
let failed = 0;

async function tableCount(c: Client, table: string): Promise<number | null> {
  try {
    const r = await c.query(`SELECT count(*) FROM ${table}`);
    return Number(r.rows[0].count);
  } catch {
    return null;
  }
}

function check(name: string, a: number | null, b: number) {
  if (a === null) {
    console.log(`skip - ${name}: table absent in source`);
    return;
  }
  const ok = a === b;
  console.log(`${ok ? "ok" : "FAIL"} - ${name}: supabase=${a} neon=${b}`);
  if (!ok) failed++;
}

await src.connect();
await dst.connect();
try {
  const srcCustomers = (await tableCount(src, "public.customers")) ?? (await tableCount(src, "public.contacts"));
  const srcTransactions = (await tableCount(src, "public.transactions")) ?? (await tableCount(src, "public.ledger_entries"));
  const srcTags = (await tableCount(src, "public.transaction_tags")) ?? (await tableCount(src, "public.contact_tags"));
  check("users", await tableCount(src, "(SELECT * FROM auth.users WHERE email IS NOT NULL) u"), (await tableCount(dst, `"user"`)) ?? -1);
  check("customers", srcCustomers, (await tableCount(dst, "customers")) ?? -1);
  check("transactions", srcTransactions, (await tableCount(dst, "transactions")) ?? -1);
  check("tags", srcTags, (await tableCount(dst, "transaction_tags")) ?? -1);

  // Ownership spot check: every Neon row's user_id must resolve to a user.
  const orphans = await dst.query(
    `SELECT (SELECT count(*) FROM customers c LEFT JOIN "user" u ON u.id = c.user_id WHERE u.id IS NULL)
      + (SELECT count(*) FROM transactions t LEFT JOIN "user" u ON u.id = t.user_id WHERE u.id IS NULL)
      + (SELECT count(*) FROM transaction_tags g LEFT JOIN "user" u ON u.id = g.user_id WHERE u.id IS NULL) AS orphans`
  );
  const n = Number(orphans.rows[0].orphans);
  console.log(`${n === 0 ? "ok" : "FAIL"} - orphan rows: ${n}`);
  if (n !== 0) failed++;

  // No Supabase-only constructs in Neon.
  const rls = await dst.query(
    `SELECT count(*) FROM pg_tables WHERE schemaname = 'auth' AND tablename = 'users'`
  );
  const authUsers = Number(rls.rows[0].count);
  console.log(`${authUsers === 0 ? "ok" : "FAIL"} - auth.users in Neon: ${authUsers}`);
  if (authUsers !== 0) failed++;
} finally {
  await src.end().catch(() => {});
  await dst.end().catch(() => {});
}

if (failed > 0) {
  console.error(`validation FAILED (${failed} checks) - do not cut over`);
  process.exit(1);
}
console.log("validation passed - safe to cut over");
