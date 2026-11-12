import { Redirect } from "expo-router";
import { useAuth } from "@/hooks/useAuth";
import { resolveEntryRoute } from "@/lib/routes";

/**
 * The entry route is the deep link that carries the user back from the
 * browser during the Google sign-in flow. It resolves the session first, so
 * an authenticated user lands on the home screen instead of the login page.
 */
export default function Index() {
  const { session, loading } = useAuth();
  const destination = resolveEntryRoute({ loading, session });

  // Nothing to route to while the session is still being resolved; the auth
  // guard keeps the loader on screen.
  if (!destination) return null;

  return <Redirect href={destination} />;
}
