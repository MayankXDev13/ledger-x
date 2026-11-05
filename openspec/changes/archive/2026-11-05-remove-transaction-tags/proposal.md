# Proposal

## Why

Transaction tags are unused complexity: they add CRUD endpoints, join-table logic, UI, and audit surface with no user demand. Removing them fully simplifies the API, schema, and clients.

## What Changes

- **BREAKING** Remove `GET/POST /transaction-tags`, `PUT/DELETE /transaction-tags/:id`.
- **BREAKING** Remove `GET/POST /transactions/:id/tags`, `DELETE /transactions/:id/tags/:tagId`.
- Remove `transaction_tags` and `transaction_tag_map` tables via migration (drop FKs, indexes, relations).
- Remove tags UI (`apps/web/app/(app)/tags/page.tsx`, `tagsApi`, transaction-tag helpers/hooks, validators `createTagSchema`/`updateTagSchema`/`addTagToTransactionSchema`).
- Remove tag-related audit events (`tag.create`, `tag.update`, `tag.delete`, `tag.associate`, `tag.dissociate`) and any tag audit emission.
- Update route registration, auth-middleware coverage, and contract tests that assert tag behavior.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `web-api-integration`: remove the "Canonical tag endpoints" requirement — tag CRUD and transaction-tag association endpoints no longer exist; `/transactions/:id` routing no longer needs tag-shadowing protection.
- `audit-logging`: narrow "Data mutations are audited" — customers and transactions remain audited; tags and tag associations are no longer audited entities.

## Impact

- Affected code: `apps/api/src/routes/tags.ts`, `apps/api/src/routes/transactions.ts` (tag sub-routes), `apps/api/src/app.ts`, `apps/api/src/db/schema.ts`, `apps/api/src/validators/*`, `apps/api/src/lib/audit.ts`, `apps/web` tags page + `lib/api.ts` + hooks.
- DB: destructive migration dropping two tables; requires backup/coordination if any production tag rows exist.
- Clients: any caller of `/transaction-tags*` or `/transactions/*/tags*` breaks with 404 after removal; web and mobile clients must drop tag calls.
