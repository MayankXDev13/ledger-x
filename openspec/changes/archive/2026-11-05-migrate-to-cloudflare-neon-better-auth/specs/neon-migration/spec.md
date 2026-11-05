# Spec Delta

## Purpose

Moves all product data from Supabase Postgres to Neon Postgres safely with a verified R2 backup first.

## ADDED Requirements

### Requirement: Full Supabase backup to R2 before migration

The system SHALL capture a full logical backup of the Supabase database before any Neon import and SHALL store the dump plus a manifest with checksum, timestamp, and row counts in Cloudflare R2.

#### Scenario: Backup verified before import

- **WHEN** the migration starts
- **THEN** an R2 backup object exists with matching checksum and a restore dry-run has succeeded, otherwise the import does not begin

#### Scenario: Backup is restorable

- **WHEN** the R2 backup is restored to an empty Postgres
- **THEN** table counts match the manifest and no error aborts the restore

### Requirement: Neon schema via Drizzle

Neon SHALL host the product schema managed by Drizzle ORM migrations, including Better Auth tables (`user`, `session`, `account`, `verification`) and existing domain tables (customers, transactions, tags, tag maps) with `user_id` relinked to Better Auth `user.id`.

#### Scenario: Drizzle migrations apply cleanly

- **WHEN** Drizzle migrations run against an empty Neon branch
- **THEN** all tables and indexes are created without error

#### Scenario: Supabase-only constructs removed

- **WHEN** the Neon schema is inspected
- **THEN** it contains no `auth.users` references or Supabase RLS policies

### Requirement: Idempotent Supabase to Neon data import

The import SHALL copy every user, customer, transaction, tag, and tag association from the verified backup to Neon, preserving IDs and ownership links, and SHALL be safe to re-run without duplicating rows.

#### Scenario: Re-run does not duplicate

- **WHEN** the import runs twice against the same Neon target
- **THEN** row counts remain correct and ownership links are unchanged

#### Scenario: Ownership preserved

- **WHEN** a migrated user logs in after reset
- **THEN** they see exactly their own pre-migration customers, transactions, and tags

### Requirement: Cutover with rollback window

Cutover SHALL switch reads and writes to Neon only after backup verification and import validation pass, and SHALL retain the Supabase source read-only until acceptance so rollback remains possible.

#### Scenario: Failed validation blocks cutover

- **WHEN** row-count or spot-check validation fails
- **THEN** traffic stays on Supabase and no write goes to Neon

#### Scenario: Rollback restores service

- **WHEN** rollback is invoked during the window
- **THEN** traffic returns to the Supabase source with no data write to Neon treated as authoritative
