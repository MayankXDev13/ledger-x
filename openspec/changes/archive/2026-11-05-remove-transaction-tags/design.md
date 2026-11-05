# Design

## Context

See proposal.md Why. Current state: `tagsApp` mounted at `/transaction-tags` in `apps/api/src/app.ts`; tag association sub-routes live inside `transactions.ts` before `/:id` so they are not shadowed; Drizzle tables `transaction_tags` + `transaction_tag_map` with cascade FKs; Zod validators `createTagSchema`/`updateTagSchema`/`addTagToTransactionSchema`; `AuditAction` includes five `tag.*` variants; web tags page at `apps/web/app/(app)/tags/page.tsx` plus `tagsApi` and transaction-tag helpers in `lib/api.ts`.

## Goals / Non-Goals

**Goals:**
- No reachable tag code, route, table, or audit event remains.
- Removed paths fail closed with the standard `404` JSON envelope.
- Migration is reversible in staging and safe to re-run.

**Non-Goals:**
- Data-preserving soft-delete or export of existing tags (user chose full removal; operator backs up if needed).
- Replacing tags with categories/labels — no substitute taxonomy in this change.

## Decisions

- **Delete `routes/tags.ts` outright, strip tag blocks from `transactions.ts`** over feature-flagging. Rationale: user wants full removal; flags leave dead surface. Alternative (hide UI only) rejected per user answer.
- **Drizzle migration drops `transaction_tag_map` first, then `transaction_tags`** (FK order), removing indexes/unique constraint. Rationale: avoids FK violation; cascade handles orphan rows. Check `drizzle/` migration naming convention before writing.
- **Remove tag validators and audit variants together** (`validators.ts`, `lib/audit.ts`, call sites). Rationale: keeps `bun run test` / typecheck green; leaving unused exports invites re-use.
- **Update contract tests to assert 404 on removed paths** instead of deleting all tag coverage. Rationale: locks in the breaking change and catches accidental re-introduction.

## Risks / Trade-offs

- [Risk] Existing production tag rows are destroyed → Mitigation: document pre-migration backup step in tasks; verify row count is zero or exported before drop.
- [Risk] Stale mobile/web clients still call tag endpoints → Mitigation: 404 envelope is explicit; remove all first-party callers in same change.
- [Risk] Route-ordering regression (`/:id` shadowing) masked by deletion → Mitigation: keep a regression test that `GET /transactions/:id` still resolves for valid ids while `/transaction-tags` 404s.

## Migration Plan

1. Land code removal + migration in one deploy (no phased rollout; endpoints are removed atomically).
2. Pre-deploy: back up `transaction_tags` / `transaction_tag_map` if non-empty.
3. Deploy API, run Drizzle migration, verify removed paths return `404` JSON and transaction CRUD still works.
4. Rollback: revert commit + restore tables from backup (new tags created after rollback window are not recoverable).

## Open Questions

None — remaining OAuth-only and customer-share-page scopes are separate changes.
