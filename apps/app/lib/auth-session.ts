// Google-only sign-in via the Better Auth API handler (`/api/auth/*`).
// The Expo client opens the Google flow in the system browser and returns
// to the app via deep link (scheme "ledgerx" from app.json).
// The session token is persisted in AsyncStorage and sent as
// `Authorization: Bearer <token>` (unchanged contract; see docs/auth-migration.md).
import { createAuthClient } from "better-auth/react";
import { expoClient } from "@better-auth/expo/client";
// The Better Auth Expo plugin opens the OAuth flow with a *dynamic* import of
// `expo-web-browser`. Metro only bundles modules it can see statically, so
// without this import the sign-in throws "Requiring unknown module
// 'expo-web-browser'" the first time a user taps "Continue with Google".
import "expo-web-browser";
import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";

const TOKEN_KEY = "ledgerx_session_token";

function baseUrl(): string {
  const url = process.env.EXPO_PUBLIC_API_URL;
  if (!url) throw new Error("EXPO_PUBLIC_API_URL is not set");
  return url.replace(/\/$/, "");
}

// Determine the redirect scheme. ALWAYS use the app scheme from app.json.
// In Expo Go, Linking.createURL() automatically resolves this to an
// exp:// return URL, so the browser returns to Expo Go. Hardcoding "exp"
// here breaks the expo-origin header check on the server.
// If the standalone APK is also installed, Android routes ledgerx://
// to the APK instead of Expo Go — uninstall the APK while testing in Go.

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
