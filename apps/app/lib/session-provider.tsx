import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  getSessionUser,
  signOut as signOutSession,
  type SessionUser,
} from "@/lib/auth-session";

export interface SessionValue {
  user: SessionUser | null;
  session: { user: SessionUser } | null;
  loading: boolean;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
}

const SessionContext = createContext<SessionValue | null>(null);

/**
 * Resolves the signed-in session once for the whole app.
 *
 * Before this existed every screen that called `useAuth()` ran its own
 * `getSessionUser()` round-trip, so a cold start made five identical requests
 * and each screen could disagree about whether the user was signed in.
 */
export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const next = await getSessionUser();
      setUser(next);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    await signOutSession();
    setUser(null);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const value = useMemo<SessionValue>(
    () => ({
      user,
      session: user ? { user } : null,
      loading,
      refresh,
      signOut,
    }),
    [user, loading, refresh, signOut],
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

/** The shared session. Throws if used outside the provider. */
export function useSession(): SessionValue {
  const value = useContext(SessionContext);
  if (!value) {
    throw new Error("useSession must be used inside a SessionProvider");
  }
  return value;
}
