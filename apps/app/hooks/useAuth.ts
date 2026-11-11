import { useSession, type SessionValue } from "@/lib/session-provider";

/**
 * The signed-in session, resolved once by `SessionProvider`.
 *
 * Call sites keep the same shape; the difference is that the session is
 * fetched once for the app instead of once per screen.
 */
export function useAuth(): SessionValue {
  return useSession();
}
