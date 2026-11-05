# Tags removal — migration runbook

Applies to change `remove-transaction-tags` (`drizzle/0004_remove-transaction-tags.sql`:
`DROP TABLE "transaction_tag_map" CASCADE` then `DROP TABLE "transaction_tags" CASCADE`).
Destructive: no down migration. Back up before deploying.

## 1. Pre-deploy backup check

Run against the production database before migrating:

```sql
SELECT count(*) AS tag_rows FROM transaction_tags;
SELECT count(*) AS tag_map_rows FROM transaction_tag_map;
```

- If both counts are `0`: proceed, no backup needed (note the zero counts in the deploy log).
- If either count is non-zero: pg_dump the two tables before migrating:

```sh
pg_dump "$DATABASE_URL" -t transaction_tags -t transaction_tag_map \
  -Fc -f /tmp/opencode/tags-backup.dump
```

## 2. Apply

`bun run db:migrate` (or `db:migrate:neon`) against the target, then verify:

```sql
SELECT to_regclass('transaction_tags'), to_regclass('transaction_tag_map');
```

Both must return `NULL`. Removed paths (`/transaction-tags*`, `/transactions/:id/tags*`)
must return `404` with the JSON error envelope.

## 3. Restore path (rollback window)

Revert the API deployment, then restore the tables from backup:

```sh
pg_restore -d "$DATABASE_URL" -t transaction_tags -t transaction_tag_map /tmp/opencode/tags-backup.dump
```

Rows created after the backup are not recoverable.
