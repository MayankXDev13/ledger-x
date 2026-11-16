"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signInWithGoogle } from "@/lib/auth";
import { LOGIN_ROUTE } from "@/lib/auth-redirect";
import { attemptGoogleSignIn, GENERIC_AUTH_ERROR } from "@/lib/auth-error";
import { AuthErrorBanner } from "@/components/login/AuthErrorBanner";
import { BrandPanel } from "@/components/login/BrandPanel";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // Better Auth reports failures via `error`; `error_description` is read only
  // so its query parameter is cleared too, never rendered verbatim.
  const errorCode = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");
  // Copy the error into local state before clearing the query so the message
  // survives the URL change without a setState call inside an effect.
  const [shownError, setShownError] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return new URLSearchParams(window.location.search).get("error");
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!errorCode && !errorDescription) return;
    router.replace(LOGIN_ROUTE);
  }, [errorCode, errorDescription, router]);

  const handleGoogleSignIn = useCallback(async () => {
    setLoading(true);
    setShownError(null);
    // Failures keep the user on this screen; no navigation is issued here.
    const result = await attemptGoogleSignIn(signInWithGoogle);
    if (!result.ok) {
      toast.error(result.message ?? GENERIC_AUTH_ERROR);
    }
    setLoading(false);
  }, []);

  return (
    <div className="min-h-screen bg-background flex">
      <BrandPanel />
      <div className="flex-1 flex items-center justify-center p-8">
        <Card className="w-full max-w-sm border-border/50 bg-card/80">
          <CardContent className="pt-6 space-y-4">
            <div>
              <h1 className="text-2xl font-bold">Welcome back</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Sign in with your Google account to continue
              </p>
            </div>
            {shownError && (
              <AuthErrorBanner code={shownError} onRetry={handleGoogleSignIn} />
            )}
            <Button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full font-semibold"
            >
              {loading ? "Redirecting…" : "Continue with Google"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
