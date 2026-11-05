/**
 * Idempotent Supabase -> Neon import.
 * Handles BOTH source schemas:
 *  - API schema: public.customers / transactions / transaction_tags / transaction_tag_map
 *  - Mobile schema: public.contacts / ledger_entries / contact_tags / contact_tag_map
 *    (contacts -> customers, ledger_entries -> transactions with user_id from the
 *    parent contact, amounts cast numeric->integer; contact-level tag maps have no
 *    transaction equivalent and are reported, not imported)
 * Users: auth.users (id, email, created_at) -> "user" with email_verified=false.
 * Safe to re-run: ON CONFLICT DO NOTHING everywhere.
 * Usage: SUPABASE_DB_URL=... DATABASE_URL=... bun run import:supabase
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

async function exists(table: string): Promise<boolean> {
  const r = await src.query(
    `SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename=$1`,
    [table]
  );
  return r.rows.length > 0;
}

async function copyUsers(): Promise<number> {
  const { rows } = await src.query(
    `SELECT id::text AS id, email, created_at FROM auth.users WHERE email IS NOT NULL ORDER BY created_at`
  );
  let n = 0;
  for (const u of rows) {
    await dst.query(
      `INSERT INTO "user" (id, name, email, email_verified, created_at, updated_at)
       VALUES ($1, $2, $3, false, COALESCE($4, now()), now())
       ON CONFLICT (id) DO NOTHING`,
      [u.id, u.email.split("@")[0], u.email, u.created_at]
    );
    n++;
  }
  return n;
}

async function copyCustomers(): Promise<number> {
  if (await exists("customers")) {
    const { rows } = await src.query(
      `SELECT id::text AS id, user_id::text AS user_id, name, phone, created_at, updated_at, deleted_at FROM public.customers`
    );
    for (const r of rows) {
      await dst.query(
        `INSERT INTO customers (id, user_id, name, phone, created_at, updated_at, deleted_at)
         VALUES ($1,$2,$3,$4,COALESCE($5,now()),COALESCE($6,now()),$7) ON CONFLICT (id) DO NOTHING`,
        [r.id, r.user_id, r.name, r.phone, r.created_at, r.updated_at, r.deleted_at]
      );
    }
    console.log(`customers (api schema): ${rows.length}`);
    return rows.length;
  }
  // Mobile schema: contacts -> customers
  const { rows } = await src.query(
    `SELECT id::text AS id, user_id::text AS user_id, name, phone, created_at, deleted_at FROM public.contacts`
  );
  for (const r of rows) {
    await dst.query(
      `INSERT INTO customers (id, user_id, name, phone, created_at, updated_at, deleted_at)
       VALUES ($1,$2,$3,$4,COALESCE($5,now()),COALESCE($5,now()),$6) ON CONFLICT (id) DO NOTHING`,
      [r.id, r.user_id, r.name, r.phone, r.created_at, r.deleted_at]
    );
  }
  console.log(`customers (from contacts): ${rows.length}`);
  return rows.length;
}

async function copyTransactions(): Promise<number> {
  if (await exists("transactions")) {
    const { rows } = await src.query(
      `SELECT id::text AS id, user_id::text AS user_id, customer_id::text AS customer_id, amount, type, note, created_at, updated_at, deleted_at FROM public.transactions`
    );
    for (const r of rows) {
      await dst.query(
        `INSERT INTO transactions (id, user_id, customer_id, amount, type, note, created_at, updated_at, deleted_at)
         VALUES ($1,$2,$3,$4,$5,$6,COALESCE($7,now()),COALESCE($8,now()),$9) ON CONFLICT (id) DO NOTHING`,
        [r.id, r.user_id, r.customer_id, r.amount, r.type, r.note, r.created_at, r.updated_at, r.deleted_at]
      );
    }
    console.log(`transactions (api schema): ${rows.length}`);
    return rows.length;
  }
  // Mobile schema: ledger_entries -> transactions (user_id via parent contact)
  const { rows } = await src.query(
    `SELECT e.id::text AS id, c.user_id::text AS user_id, e.contact_id::text AS customer_id,
            e.amount::integer AS amount, e.type::text AS type, e.note,
            e.created_at, e.updated_at,
            c.deleted_at AS contact_deleted_at
     FROM public.ledger_entries e JOIN public.contacts c ON c.id = e.contact_id`
  );
  let skipped = 0;
  for (const r of rows) {
    if (r.type !== "credit" && r.type !== "debit") {
      skipped++;
      continue;
    }
    await dst.query(
      `INSERT INTO transactions (id, user_id, customer_id, amount, type, note, created_at, updated_at, deleted_at)
       VALUES ($1,$2,$3,$4,$5,$6,COALESCE($7,now()),COALESCE($8,now()),$9) ON CONFLICT (id) DO NOTHING`,
      [r.id, r.user_id, r.customer_id, r.amount, r.type, r.note, r.created_at, r.updated_at, r.contact_deleted_at]
    );
  }
  console.log(`transactions (from ledger_entries): ${rows.length} (skipped ${skipped})`);
  return rows.length;
}

async function copyTags(): Promise<number> {
  const srcTable = (await exists("transaction_tags")) ? "transaction_tags" : "contact_tags";
  const { rows } = await src.query(
    `SELECT id::text AS id, user_id::text AS user_id, name, color, created_at, updated_at, deleted_at FROM public.${srcTable}`
  ).catch(async () => {
    const r2 = await src.query(
      `SELECT id::text AS id, user_id::text AS user_id, name, color, created_at FROM public.${srcTable}`
    );
    return { rows: r2.rows.map((r: Record<string, unknown>) => ({ ...r, updated_at: null, deleted_at: null })) };
  });
  for (const r of rows) {
    await dst.query(
      `INSERT INTO transaction_tags (id, user_id, name, color, created_at, updated_at, deleted_at)
       VALUES ($1,$2,$3,$4,COALESCE($5,now()),COALESCE($6,now()),$7) ON CONFLICT (id) DO NOTHING`,
      [r.id, r.user_id, r.name, r.color ?? null, r.created_at, r.updated_at, r.deleted_at]
    );
  }
  console.log(`tags (from ${srcTable}): ${rows.length}`);
  return rows.length;
}

async function copyTagMap(): Promise<number> {
  if (await exists("transaction_tag_map")) {
    const { rows } = await src.query(
      `SELECT transaction_id::text AS tid, tag_id::text AS gid, created_at FROM public.transaction_tag_map`
    );
    for (const r of rows) {
      await dst.query(
        `INSERT INTO transaction_tag_map (transaction_id, tag_id, created_at)
         VALUES ($1,$2,COALESCE($3,now())) ON CONFLICT DO NOTHING`,
        [r.tid, r.gid, r.created_at]
      );
    }
    console.log(`tag maps: ${rows.length}`);
    return rows.length;
  }
  const { rows } = await src
    .query(`SELECT count(*) AS n FROM public.contact_tag_map`)
    .catch(() => ({ rows: [{ n: "0" }] }));
  console.log(
    `tag maps: 0 imported (contact-level tag associations have no transaction equivalent; ${rows[0].n} contact_tag_map rows left in Supabase)`
  );
  return 0;
}

async function main() {
  await src.connect();
  await dst.connect();
  try {
    console.log(`users: ${await copyUsers()}`);
    await copyCustomers();
    await copyTransactions();
    await copyTags();
    await copyTagMap();
    console.log("import complete (idempotent, safe to re-run)");
  } finally {
    await src.end().catch(() => {});
    await dst.end().catch(() => {});
  }
}

await main();
