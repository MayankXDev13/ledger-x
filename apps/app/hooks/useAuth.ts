import { useEffect, useState } from "react";
import { getSessionUser, type SessionUser } from "@/lib/auth-session";

export function useAuth() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [session, setSession] = useState<{ user: SessionUser } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSessionUser()
      .then((u) => {
        setUser(u);
        setSession(u ? { user: u } : null);
      })
      .finally(() => setLoading(false));
  }, []);

  return { user, session, loading };
}
