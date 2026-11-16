/** Authentication error presentation helpers shared by the login screen. */

export const GENERIC_AUTH_ERROR = "We couldn't sign you in. Please try again.";

const MESSAGES: Record<string, string> = {
  state_mismatch: "Your sign-in session expired. Please try again.",
  state_not_found: "Your sign-in session expired. Please try again.",
  access_denied: "Sign-in was cancelled. Try again whenever you're ready.",
  no_code: "Google didn't complete the sign-in. Please try again.",
  oauth_provider_not_found:
    "Google sign-in is temporarily unavailable. Please try again.",
  oauth_provider_error:
    "Google couldn't complete sign-in right now. Please try again.",
  email_not_found:
    "We couldn't get your email address from Google. Please try again.",
  no_callback_url: "The sign-in redirect was invalid. Please try again.",
};

/** Translate an OAuth error code into readable copy. Unknown codes stay generic. */
export function authErrorMessage(code?: string | null): string {
  if (!code) return GENERIC_AUTH_ERROR;
  return MESSAGES[code] ?? GENERIC_AUTH_ERROR;
}

/**
 * Run a client-side sign-in attempt without navigating away on failure. The
 * caller decides how to present `message`; no redirect is ever issued here so
 * the user stays on the login screen when the attempt rejects.
 */
export async function attemptGoogleSignIn(
  signIn: () => Promise<void>,
): Promise<{ ok: boolean; message?: string }> {
  try {
    await signIn();
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : GENERIC_AUTH_ERROR,
    };
  }
}
