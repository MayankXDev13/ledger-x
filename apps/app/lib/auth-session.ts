// Better Auth session provider for the Expo app (replaces supabase.auth).
// The Workers API issues opaque session tokens via POST /auth/*. Screens send
// them as `Authorization: Bearer <token>`. Migrated users must finish the
// password-reset flow before first login (see docs/auth-migration.md).
import AsyncStorage from "@react-native-async-storage/async-storage";

const TOKEN_KEY = "ledgerx_session_token";

function baseUrl(): string {
  const url = process.env.EXPO_PUBLIC_API_URL;
  if (!url) throw new Error("EXPO_PUBLIC_API_URL is not set");
  return url.replace(/\/$/, "");
}

export async function getSessionToken(): Promise<string | null> {
  return AsyncStorage.getItem(TOKEN_KEY);
}

export async function setSessionToken(token: string | null): Promise<void> {
  if (token) await AsyncStorage.setItem(TOKEN_KEY, token);
  else await AsyncStorage.removeItem(TOKEN_KEY);
}

export async function getAuthHeaders(): Promise<Record<string, string>> {
  const token = await getSessionToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function post<T>(path: string, body?: unknown, token?: string): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const t = token ?? (await getSessionToken());
  if (t) headers.Authorization = `Bearer ${t}`;
  const res = await fetch(`${baseUrl()}${path}`, {
    method: "POST",
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

export type SessionUser = { id: string; email: string };

export async function signUp(email: string, password: string) {
  const data = await post<{ id: string; email: string; token: string }>(
    "/auth/signup",
    { email, password },
  );
  await setSessionToken(data.token);
  return data;
}

export async function signIn(email: string, password: string) {
  const data = await post<{ id: string; email: string; token: string }>(
    "/auth/login",
    { email, password },
  );
  await setSessionToken(data.token);
  return data;
}

export async function signOut(): Promise<void> {
  try {
    await post("/auth/logout", {});
  } finally {
    await setSessionToken(null);
  }
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const token = await getSessionToken();
  if (!token) return null;
  const res = await fetch(`${baseUrl()}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    await setSessionToken(null);
    return null;
  }
  const data = (await res.json()) as SessionUser;
  return { id: data.id, email: data.email };
}

export async function requestPasswordReset(email: string): Promise<void> {
  await post("/auth/request-reset", { email });
}

export async function resetPassword(
  email: string,
  token: string,
  newPassword: string,
): Promise<void> {
  await post("/auth/reset-password", { email, token, newPassword });
}

export async function changePassword(
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  await post("/auth/change-password", { currentPassword, newPassword });
}
