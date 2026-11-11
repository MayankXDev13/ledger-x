/**
 * The single route a signed-in user lands on.
 *
 * The OAuth callback, the root page and the auth guard all use this constant
 * so a user never arrives at different screens depending on how they signed
 * in.
 */
export const LANDING_ROUTE = "/dashboard";
