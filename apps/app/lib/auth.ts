import { LOGIN_ROUTE } from "@/lib/routes";

/**
 * Routes a visitor may reach without a session.
 *
 * The entry route is public because it decides where to send the user once
 * the session is known; the login screen is public because it is the screen
 * the guard sends anonymous users to.
 */
export const publicRoutes = ["/", LOGIN_ROUTE];
