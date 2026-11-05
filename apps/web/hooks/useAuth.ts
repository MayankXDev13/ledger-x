"use client";

import { useState, useEffect, useCallback } from "react";
import { getToken, logout as apiLogout, me, type SessionUser } from "@/lib/auth";

export function useAuth() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }
    me(token)
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const signOut = useCallback(async () => {
    await apiLogout();
    setUser(null);
  }, []);

  return { user, loading, signOut };
}
