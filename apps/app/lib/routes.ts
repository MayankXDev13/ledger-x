/**
 * The single route a signed-in user lands on.
 *
 * The OAuth callback, the auth guard and the login screen all use this
 * constant so a user never arrives at different screens depending on how
 * they signed in.
 */
export const LANDING_ROUTE = "/(tabs)/home";

/** The route an anonymous user is sent to. */
export const LOGIN_ROUTE = "/auth/login";

export type EntryRouteInput = {
  /** True while the session has not been resolved yet. */
  loading: boolean;
  /** The resolved session, or null when nobody is signed in. */
  session: { user: unknown } | null;
};

/**
 * Where the app's entry route should send the user.
 *
 * The entry route is the deep link that carries the user back from the
 * browser during the OAuth flow, so it has to decide with the *current*
 * session: an authenticated user belongs on the landing route, not on the
 * login screen.
 *
 * Returns null while the session is still being resolved, because there is
 * nothing to route to yet.
 */
export function resolveEntryRoute(
  input: EntryRouteInput,
): typeof LANDING_ROUTE | typeof LOGIN_ROUTE | null {
  if (input.loading) return null;
  return input.session ? LANDING_ROUTE : LOGIN_ROUTE;
}
