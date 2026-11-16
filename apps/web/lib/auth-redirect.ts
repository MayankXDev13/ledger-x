import { LANDING_ROUTE } from "./routes";

/** Route that shows authentication failures and lets the user retry. */
export const LOGIN_ROUTE = "/login";

/**
 * Build the direct-navigation Google sign-in URL. Both the success and error
 * targets are sent so the API can keep failures inside the web app.
 */
export function googleRedirectURL(webOrigin: string, apiOrigin: string): string {
  const callbackURL = `${webOrigin}${LANDING_ROUTE}`;
  const errorCallbackURL = `${webOrigin}${LOGIN_ROUTE}`;
  const query = new URLSearchParams({
    callbackURL,
    errorCallbackURL,
  });
  return `${apiOrigin}/api/auth/redirect/google?${query.toString()}`;
}
