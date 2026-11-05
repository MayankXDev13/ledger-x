# Tasks

## 1. API route removal

- [x] 1.1 Delete `apps/api/src/routes/tags.ts`, unregister `/transaction-tags` route and `authMiddleware` entry in `app.ts`, and verify `grep -r transaction-tags apps/api/src` returns no route registration.
- [x] 1.2 Remove tag association blocks (`GET/POST /:id/tags`, `DELETE /:id/tags/:tagId`) and `transactionTags`/`transactionTagMap` imports from `routes/transactions.ts`, and verify `GET /transactions/:id` still resolves and tag paths return 404 JSON envelope in contract tests.
- [x] 1.3 Remove `createTagSchema`/`updateTagSchema`/`addTagToTransactionSchema` from `validators.ts` and tag audit variants plus emitters in `lib/audit.ts`, and verify `tsc --noEmit` (or `bun run check`) passes with no tag references.

## 2. Database migration

- [x] 2.1 Add Drizzle migration dropping `transaction_tag_map` then `transaction_tags` (indexes, unique constraint, FKs) plus removed relations in `db/schema.ts`, and verify migration applies and rolls back cleanly on a scratch database.
- [x] 2.2 Document pre-deploy backup check for existing tag rows, and verify migration runbook lists row-count query and restore path.

## 3. Web and mobile clients

- [x] 3.1 Delete `apps/web/app/(app)/tags/page.tsx`, `tagsApi` and transaction-tag helpers in `lib/api.ts`, and related hooks/components, and verify `grep -ri "transaction-tags\|useTags" apps/web/app apps/web/lib apps/web/hooks apps/web/components` is clean.
- [x] 3.2 Remove tag calls from mobile app (`apps/app`) and verify no `transaction-tags` or tag-screen references remain.

## 4. Contract and regression verification

- [x] 4.1 Update API contract tests: removed tag paths assert 404 JSON envelope, ownership tests cover only customers/transactions, and verify `bun run test` passes from repo root without external services.
- [x] 4.2 Run end-to-end smoke (transactions CRUD, customers, dashboard, audit logs) and verify no tag UI, endpoint, or audit event is reachable.
