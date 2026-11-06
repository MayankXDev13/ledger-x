// Google-only sign-in via the Better Auth API handler (`/api/auth/*`).
// After sign-in the session token is persisted from the `set-auth-token`
// response header and sent as `Authorization: Bearer <token>` (unchanged
// contract; see docs/auth-migration.md).

import { createAuthClient } from "better-auth/react";

const TOKEN_KEY = "ledgerx_token";

function baseUrl(): string {
  if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787";
}

export const authClient = createAuthClient({
  baseURL: `${baseUrl()}/api/auth`,
  fetchOptions: {
    credentials: "include",
  },
});

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) window.localStorage.setItem(TOKEN_KEY, token);
  else window.localStorage.removeItem(TOKEN_KEY);
}

export type SessionUser = {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
};

export async function signInWithGoogle() {
  // Navigate directly to the API domain so the OAuth state cookie is set
  // same-site (not via cross-origin fetch). This prevents the state_mismatch
  // error caused by browsers blocking third-party cookies.
  const callbackURL = `${window.location.origin}/dashboard`;
  window.location.href = `${baseUrl()}/api/auth/redirect/google?callbackURL=${encodeURIComponent(callbackURL)}`;
}

function harvestToken(response: Response | undefined) {
  const token = response?.headers.get("set-auth-token");
  if (token) setToken(token);
}

/** Load the session, persisting the Bearer token when the API provides it. */
export async function loadSession(): Promise<SessionUser | null> {
  const { data, error } = await authClient.getSession({
    fetchOptions: {
      onSuccess: (ctx) => harvestToken(ctx.response),
    },
  });
  if (error || !data?.user) return null;
  return {
    id: data.user.id,
    email: data.user.email,
    name: data.user.name ?? null,
    image: data.user.image ?? null,
  };
}

export async function logout() {
  const token = getToken();
  try {
    if (token) {
      await fetch(`${baseUrl()}/auth/logout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
    }
  } finally {
    setToken(null);
  }
}

export async function me(token?: string): Promise<SessionUser> {
  const t = token ?? getToken();
  const res = await fetch(`${baseUrl()}/auth/me`, {
    headers: t ? { Authorization: `Bearer ${t}` } : {},
  });
  const data = (await res.json().catch(() => ({}))) as (SessionUser & {
    error?: string;
  });
  if (!res.ok) throw new Error(data.error || "Unauthenticated");
  return { id: data.id, email: data.email, name: data.name, image: data.image };
}

export { baseUrl as apiBaseUrl };
