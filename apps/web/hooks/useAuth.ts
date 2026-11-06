"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getToken,
  setToken,
  loadSession,
  logout as apiLogout,
  type SessionUser,
} from "@/lib/auth";

export function useAuth() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // After Google OAuth callback, the API appends the bearer token to the
    // redirect URL as a hash fragment: /dashboard#token=<session-token>.
    // Extract it synchronously, store in localStorage, then authenticate.
    let hashToken: string | null = null;
    if (typeof window !== "undefined" && window.location.hash) {
      const params = new URLSearchParams(window.location.hash.slice(1));
      hashToken = params.get("token");
      if (hashToken) {
        setToken(hashToken);
        // Clean the hash from the URL without a reload
        window.history.replaceState(
          null,
          "",
          window.location.pathname + window.location.search,
        );
      }
    }

    // If we just got a token from the hash, use it directly to load the user.
    // Otherwise try the Better Auth session, then fall back to stored token.
    if (hashToken) {
      import("@/lib/auth")
        .then(({ me }) => me(hashToken))
        .then(setUser)
        .catch(() => setUser(null))
        .finally(() => setLoading(false));
      return;
    }

    loadSession()
      .then((u) => {
        if (u) {
          setUser(u);
          return;
        }
        if (!getToken()) {
          setUser(null);
          return;
        }
        return import("@/lib/auth").then(({ me }) =>
          me()
            .then(setUser)
            .catch(() => setUser(null)),
        );
      })
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const signOut = useCallback(async () => {
    await apiLogout();
    setUser(null);
  }, []);

  return { user, loading, signOut };
}
