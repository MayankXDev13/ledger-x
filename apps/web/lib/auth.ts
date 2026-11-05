// Better Auth–backed session client (replaces Supabase Auth).
// The API issues opaque session tokens via POST /auth/*; the browser sends
// them as `Authorization: Bearer <token>`. Migrated users must complete the
// password-reset flow before their first login (see docs/auth-migration.md).

const TOKEN_KEY = "ledgerx_token";

function baseUrl(): string {
  if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787";
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) window.localStorage.setItem(TOKEN_KEY, token);
  else window.localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(path: string, body?: unknown, token?: string): Promise<T> {
  const res = await fetch(`${baseUrl()}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

export type SessionUser = { id: string; email: string };

export async function signup(email: string, password: string) {
  const data = await request<{ id: string; email: string; token: string }>(
    "/auth/signup",
    { email, password },
  );
  setToken(data.token);
  return data;
}

export async function login(email: string, password: string) {
  const data = await request<{ id: string; email: string; token: string }>(
    "/auth/login",
    { email, password },
  );
  setToken(data.token);
  return data;
}

export async function logout() {
  const token = getToken();
  try {
    if (token) await request("/auth/logout", {}, token);
  } finally {
    setToken(null);
  }
}

export async function me(token?: string): Promise<SessionUser> {
  const t = token ?? getToken();
  const res = await fetch(`${baseUrl()}/auth/me`, {
    headers: t ? { Authorization: `Bearer ${t}` } : {},
  });
  const data = (await res.json().catch(() => ({}))) as SessionUser & { error?: string };
  if (!res.ok) throw new Error(data.error || "Unauthenticated");
  return { id: data.id, email: data.email };
}

export async function requestPasswordReset(email: string) {
  await request("/auth/request-reset", { email });
}

export async function resetPassword(email: string, token: string, newPassword: string) {
  await request("/auth/reset-password", { email, token, newPassword });
}

export { baseUrl as apiBaseUrl };
