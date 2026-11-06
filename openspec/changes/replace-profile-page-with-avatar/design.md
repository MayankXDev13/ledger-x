# Design

## Context

See proposal.md — Why. Relevant current state (verified against the code):

- **API** (`apps/api`): `verifyToken` (`src/lib/auth.ts:19`) fetches the full Better Auth session user but maps it to `{ id, email }` into `c.set("user")`; `GET /auth/me` (`src/routes/auth.ts:16`) echoes exactly those two fields. `AuthUser` is declared in `src/types/hono.ts`.
- **DB**: `user.name` (notNull) and `user.image` columns already exist; Better Auth syncs them from Google (`overrideUserInfo: true` in `src/lib/better-auth.ts`, `emailToFallbacks`/account linking set `updateUserInfoOnLink: true`). No schema change is needed.
- **Web** (`apps/web`): `SessionUser` is `{ id, email }` (`lib/auth.ts:35`); `loadSession()` narrows the Better Auth session payload (`data.user.name`/`data.user.image` are actually present there) and `me()` narrows `/auth/me`. `useAuth` feeds `AppSidebar.tsx` and the profile page.
- **UI**: Sidebar bottom user chip (`components/AppSidebar.tsx:210-274`) = click-triggered `DropdownMenu` with initials avatar, email-local-part name, `Profile` link, Sign out. Profile page (`app/(app)/profile/page.tsx`) is read-only text + sign out. Mobile bottom nav (`components/MobileBottomNav.tsx`) has a `Settings → /profile` item; `/profile` is currently the only mobile sign-out path. shadcn `avatar.tsx`, `hover-card.tsx`, `sheet.tsx` already exist.
- **In-flight change**: `openspec/changes/oauth-only-google-auth` (unarchived) keeps `/auth/me` → `id`+`email`; this change only adds optional fields, so the two changes don't conflict. That change's `user-auth` delta and this change's deltas touch disjoint capability files.

## Goals / Non-Goals

**Goals**
- Widest client-visible identity: `name` and `image` flow from Better Auth session → API → web client.
- Real OAuth avatar + first name in the sidebar chip; hover-revealed identity card with image, name, email, and Sign out.
- Mobile retains an account surface (identity + sign out) despite losing `/profile`.

**Non-Goals**
- No profile editing (names/images stay Google-managed via `updateUserInfoOnLink`).
- No change to auth mechanics, the Bearer contract, mobile (Expo) apps, or audit logging.
- No DB or Better Auth configuration changes.

## Decisions

1. **Widen `verifyToken`/`AuthUser` instead of a second DB fetch in `/auth/me`.**
   The verifier already holds the full `result.user` (Better Auth's session user carries `name`/`image`); passing `name?: string | null` and `image?: string | null` through costs nothing. Alternative: `/auth/me` calls `auth.api.getSession` itself — duplicates a connection open/close per request and duplicates code.

2. **First name = first whitespace-token of `user.name`; no `firstName` column.**
   `deriveFirstName(name, email)`: trim `name`, return its first token; fall back to the email local-part (existing behavior), then `"Account"`. A helper lives in `apps/web/lib/` and is unit-testable. Google `given_name` is scratch space variation by user; splitting the stored full name is provider-agnostic. Alternative (store `given_name` at sign-in via a Better Auth hook) adds schema/migration for no gain.

3. **Avatar rendering: `AvatarImage` + initial fallback.**
   shadcn `Avatar` already handles the loadImage failure→fallback case; initials derive from the email (first 2 chars, existing convention). Applies to chip and hover card.

4. **Hover card = existing `DropdownMenu` trigger area, replaced with `HoverCard` + click/focus fallback; Sign out moves into the card.**
   The user asked for hover to reveal identity. Radix `DropdownMenu` cannot trigger on hover; shadcn `HoverCard` can, but hover-only breaks keyboard/touch, so the card also opens on click/focus (`open`-controlled `HoverCard`). Home of the card content: larger `Avatar`, `name` (full, plus first name is what the chip shows), `email` below it, `Separator`, destructive Sign out button using the existing `handleSignOut` flow (toast + redirect to `/login`).
   Alternative: keep `DropdownMenu` and add a separate hover tooltip — two overlapping identity surfaces; rejected.

5. **Collapsed sidebar keeps hover card support.**
   Chip collapses to a 32px avatar (image fallback initials) at the same position; card opens to the right (`side="right"`) with identical content.

6. **Mobile: replace the `Settings → /profile` item with an account item that opens a `Sheet` (bottom).**
   Sheet shows avatar, name, email, Sign out — the same identity trio on small screens; preserves the currently-only mobile sign-out path. Alternatives: a route (`/account`) recreates the page we're removing; dropping mobile sign-out entirely is a regression.

7. **Profile page removal is route + imports, not a redirect.**
   `app/(app)/profile/page.tsx` is deleted; the two link sites are replaced per Decisions 4/6. A redirect route would preserve stale bookmark UX but keeps a vestigial page concept the change removes. Bookmarks to `/profile` will 404 — acceptable for an internal tool with one active user.

8. **Contract test updates.**
   `apps/api/src/test/auth.test.ts` (and harness fixtures if they mint session users) assert the `/auth/me` shape; extend expectation to include `name`/`image`. A web-side pure-function test covers `deriveFirstName` fallbacks (no jsdom needed).

## Risks / Trade-offs

- [Bookmarks to `/profile` 404] → No redirect by design (Decision 7); single-user internal app, stale-links risk is a corner case.
- [`user.image` can be null for users who never consented to a profile photo] → Initials fallback is mandatory behavior in the spec; tested.
- [Hover cards with Radix can trap pointer intent near the trigger] → Use the existing shadcn `HoverCard` with default collision padding; card only opens over content-free sidebar chrome, and click/focus fallback covers failure.
- [In-flight `oauth-only-google-auth` archives later with the old `/auth/me` scenario wording] → Its scenario says the response contains `id` and `email`, which stays true with the extra fields; flag in review not to archive it first without re-reading this delta.
- [Hash-token fast path (`useAuth`) bypasses `loadSession`] → `me()` is widened in the same change so both paths return the full shape.

## Migration Plan

1. Ship API widening first (additive fields; no client depends on their presence).
2. Ship web identity pass-through + UI changes (sidebar card, mobile sheet, page deletion) in one deploy — no intermediate state links to `/profile`.
3. No data migration; rollback = revert deploy (delete routes/pages restored by git).

## Open Questions

None — all choices above are deferred-safe or recorded as scope assumptions (mobile account sheet in Decision 6, no-redirect removal in Decision 7).
