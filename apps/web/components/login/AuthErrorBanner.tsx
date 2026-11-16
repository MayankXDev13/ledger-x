"use client";

import { authErrorMessage } from "../../lib/auth-error";

type AuthErrorBannerProps = {
  code?: string | null;
  onRetry: () => void;
};

/** Visible, retryable feedback for a failed sign-in. Never renders provider text. */
export function AuthErrorBanner({ code, onRetry }: AuthErrorBannerProps) {
  return (
    <div
      role="alert"
      className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
    >
      <p>{authErrorMessage(code)}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-1 text-sm font-medium underline underline-offset-4"
      >
        Try again
      </button>
    </div>
  );
}
