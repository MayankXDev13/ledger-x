# Proposal

## Why

The read-only `/profile` page duplicates what can be shown in one moment inside the app: the sidebar user chip already exists but displays email-derived initials and an email local-part instead of the real Google identity. Google OAuth (better-auth) already stores `user.name` and `user.image`, but the API and web client strip them, so the UI can never show the user's avatar or first name. Removing the page and surfacing the OAuth identity in place removes dead UI and matches how modern authed apps present the signed-in user.

## What Changes

- **BREAKING**: Remove the `/profile` page (`apps/web/app/(app)/profile/page.tsx`); the route and all links to it disappear.
- Extend the authenticated identity payload so session users expose their Google-sourced name and image:
  - `GET /auth/me` returns `id`, `email`, plus `name` and `image` (when present).
  - `apps/web/lib/auth.ts` (`SessionUser`, `loadSession`, `me`) passes `name` and `image` through.
- Replace email-derived identity in the sidebar user chip with real identity: OAuth `AvatarImage` (falls back to initials) and the user's first name (first word of `user.name`; falls back to email local-part).
- On hovering the sidebar user chip, a card appears showing the profile image, the user's name, and email. Click/keyboard focus opens the same card (touch and accessibility fallback), and it contains the Sign out action.
- Mobile bottom nav: replace the removed `/profile` "Settings" destination with an account item that shows the user's first name + avatar and opens a small account view (image, name, email, Sign out), preserving mobile sign-out.
- No database change: `user.name` and `user.image` already exist and are synced from Google (`overrideUserInfo: true`).

## Capabilities

### New Capabilities

- `user-profile`: Signed-in identity display in the web app — OAuth avatar image, first-name display, hover/focus identity card in the sidebar, mobile account entry, and the absence of a dedicated profile page (all inline).

### Modified Capabilities

- `web-api-integration`: The "Authenticated identity is available to handlers" requirement's `/auth/me` scenario changes to also return `name` and `image` alongside `id` and `email`.

## Impact

- **API**: `apps/api/src/lib/auth.ts` (`verifyToken`/`AuthUser`), `apps/api/src/types/hono.ts`, `apps/api/src/routes/auth.ts` (`GET /auth/me`), contract tests in `apps/api/src/test/`.
- **Web**: `apps/web/app/(app)/profile/page.tsx` (deleted), `apps/web/components/AppSidebar.tsx`, `apps/web/components/MobileBottomNav.tsx`, `apps/web/lib/auth.ts`, `apps/web/hooks/useAuth.ts`; new small account sheet/dialog component for mobile.
- **Compatibility**: The identity payload only gains optional fields, so the in-flight `oauth-only-google-auth` change's `/auth/me` expectation (returns `id` and `email`) stays true. Bearer token contract is unchanged.
- **Dependencies**: None new; uses existing shadcn `avatar`, `hover-card`, `sheet` components.
