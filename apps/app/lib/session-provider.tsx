import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AppState } from "react-native";
import {
  revalidateSession,
  signOut as signOutSession,
  type SessionUser,
} from "@/lib/auth-session";
import { clearAppLock } from "@/lib/app-lock";

export interface SessionValue {
  user: SessionUser | null;
  session: { user: SessionUser } | null;
  loading: boolean;
  refresh: () => Promise<void>;
  completeSignIn: (user: SessionUser) => void;
  signOut: () => Promise<void>;
}

const SessionContext = createContext<SessionValue | null>(null);

/**
 * Resolves the signed-in session once for the whole app.
 *
 * Before this existed every screen that called `useAuth()` ran its own
 * `getSessionUser()` round-trip, so a cold start made five identical requests
 * and each screen could disagree about whether the user was signed in.
 *
 * The provider is also the only place that knows the session is current: the
 * Google flow runs in the system browser, so the app has to re-resolve the
 * session when it comes back before anything decides where to route.
 */
export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const result = await revalidateSession();
      if (result.status === "authenticated") {
        setUser(result.user);
      } else if (result.status === "anonymous") {
        // The session is gone, so the device-local lock goes with it.
        await clearAppLock();
        setUser(null);
      }
      // "unreachable" keeps the current session: a dropped connection must
      // never sign a shopkeeper out.
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Takes over the user returned by the Google flow. The session is
   * established on the server before this runs, so the app can navigate
   * immediately instead of waiting for another round trip.
   */
  const completeSignIn = useCallback((next: SessionUser) => {
    setUser(next);
    setLoading(false);
  }, []);

  const signOut = useCallback(async () => {
    await signOutSession();
    // The lock belongs to the session: the PIN, the lock flag and the
    // attempt state are removed, so a signed-out app never asks for a PIN.
    await clearAppLock();
    setUser(null);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // The OAuth flow hands the app back from the browser. Re-resolve the
  // session when the app becomes active again so a signed-out or revoked
  // session is reflected before the next navigation decision.
  const userRef = useRef<SessionUser | null>(null);
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  useEffect(() => {
    let previous = AppState.currentState;
    const subscription = AppState.addEventListener("change", (next) => {
      const resumed = previous !== "active" && next === "active";
      previous = next;
      if (resumed && userRef.current) void refresh();
    });
    return () => subscription.remove();
  }, [refresh]);

  const value = useMemo<SessionValue>(
    () => ({
      user,
      session: user ? { user } : null,
      loading,
      refresh,
      completeSignIn,
      signOut,
    }),
    [user, loading, refresh, completeSignIn, signOut],
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
