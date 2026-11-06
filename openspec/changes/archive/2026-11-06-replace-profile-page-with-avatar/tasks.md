# Tasks

## 1. API: expose name and image on the identity payload

- [x] 1.1 Widen `AuthUser` in `apps/api/src/types/hono.ts` with optional `name: string | null` and `image: string | null`; split them out of the full session user inside `verifyToken` in `apps/api/src/lib/auth.ts` (no extra DB calls).
- [x] 1.2 In `apps/api/src/routes/auth.ts`, make `GET /auth/me` return `{ id, email, name, image }` (fields possibly null, never fabricated), keeping the payload shape otherwise unchanged.
- [x] 1.3 Update the `/auth/me` contract tests in `apps/api/src/test/auth.test.ts` (and any harness fixtures minting session users) to require `name` and `image`, including a Google-synced case and a null-image case; run `bun run test` from the repo root.

## 2. Web: pass identity through the client

- [x] 2.1 Widen `SessionUser` in `apps/web/lib/auth.ts` to `{ id, email, name: string | null, image: string | null }`; make `loadSession()` pass `data.user.name`/`data.user.image` and `me()` pass them from `/auth/me` (both the hash-token fast path and token fallback go through `me()`).
- [x] 2.2 Add `deriveFirstName(name, email)` helper in `apps/web/lib/` (first whitespace-token of `name`, fallback to email local-part, fallback `"Account"`) plus its pure-function unit tests.
- [x] 2.3 Verify `useAuth` forwards the widened `SessionUser` unchanged (no narrowing) so chips render after sign-in via either token path.

## 3. Web: sidebar identity chip and hover card

- [x] 3.1 In `components/AppSidebar.tsx`, replace initials avatar with `Avatar` + `AvatarImage` (initials fallback), and the email-local-part label with first name (collapsed state keeps the avatar-only chip).
- [x] 3.2 Replace the bottom `DropdownMenu` with an identity card (shadcn `HoverCard`, open-controlled) that opens on hover and on click/focus: large avatar, full name, email on the line below, separator, destructive Sign out button using the existing `handleSignOut` flow (toast + redirect `/login`).
- [x] 3.3 Handle slow/absent image inside the card: `AvatarImage` failure shows initials; missing name shows the email local-part; no empty states.

## 4. Web: replace mobile settings link and remove /profile

- [x] 4.1 In `components/MobileBottomNav.tsx`, replace the `Settings → /profile` item with an account item showing the avatar (image, initials fallback) and first name, stateful-free `<Link>`-less custom button; still highlight-active while open.
- [x] 4.2 Add a bottom `Sheet` account view: profile image, name, email, Sign out (reuse `handleSignOut` equivalent — call `signOut` from `useAuth`, toast, redirect to `/login`).
- [x] 4.3 Delete `apps/web/app/(app)/profile/page.tsx` and grep the app for any remaining `/profile` references or links (none should remain).

## 5. Verification

- [x] 5.1 `bun run typecheck` and `bun run lint` pass at the repo root.
- [x] 5.2 Run `bun run test` (full repo) and confirm all suites pass without external services.
- [ ] 5.3 Manual browser sanity (dev run): after Google sign-in the chip shows avatar+first name; hover opens card with image/name/email; sign out works from it; mobile shim or simulated small viewport: account item opens sheet, sign out works; navigating to `/profile` no longer finds a route.
