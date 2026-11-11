/**
 * The single route a signed-in user lands on.
 *
 * The OAuth callback, the auth guard and the login screen all use this
 * constant so a user never arrives at different screens depending on how
 * they signed in.
 */
export const LANDING_ROUTE = "/(tabs)/home";
