export const GENERIC_SIGN_IN_ERROR = "We couldn't sign you in. Please try again.";

type SignInResult<T> =
  | { ok: true; user: T }
  | { ok: false; message: string };

/**
 * Run a mobile social sign-in attempt. A failure is reported back instead of
 * throwing, so the caller stays on the login screen and can show an alert.
 */
export async function attemptMobileSignIn<T>(
  signIn: () => Promise<T>,
): Promise<SignInResult<T>> {
  try {
    const user = await signIn();
    return { ok: true, user };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error ? error.message : GENERIC_SIGN_IN_ERROR,
    };
  }
}
