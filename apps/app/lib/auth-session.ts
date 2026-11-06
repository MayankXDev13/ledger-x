// Google-only sign-in via the Better Auth API handler (`/api/auth/*`).
// The Expo client opens the Google flow in the system browser and returns
// through the `ledgerx://` deep link. The session token is persisted in
// AsyncStorage and sent as `Authorization: Bearer <token>` (unchanged
// contract; see docs/auth-migration.md).
import { createAuthClient } from "better-auth/react";
import { expoClient } from "@better-auth/expo/client";
import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";

const TOKEN_KEY = "ledgerx_session_token";

function baseUrl(): string {
  const url = process.env.EXPO_PUBLIC_API_URL;
  if (!url) throw new Error("EXPO_PUBLIC_API_URL is not set");
  return url.replace(/\/$/, "");
}

export const authClient = createAuthClient({
  baseURL: `${baseUrl()}/api/auth`,
  plugins: [
    expoClient({
      scheme: "ledgerx",
      storage: SecureStore,
    }),
  ],
});

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

export type SessionUser = { id: string; email: string };

export async function signInWithGoogle(): Promise<SessionUser> {
  await authClient.signIn.social({
    provider: "google",
    callbackURL: "/",
  });
  const user = await getSessionUser();
  if (!user) throw new Error("Google sign-in did not establish a session");
  return user;
}

export async function signOut(): Promise<void> {
  try {
    await authClient.signOut();
  } finally {
    await setSessionToken(null);
  }
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const { data, error } = await authClient.getSession();
  if (error || !data?.user) {
    await setSessionToken(null);
    return null;
  }
  if (data.session?.token) {
    await setSessionToken(data.session.token);
  }
  return { id: data.user.id, email: data.user.email };
}
