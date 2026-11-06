"use client";

import { useState } from "react";
import { signInWithGoogle } from "@/lib/auth";
import { BrandPanel } from "@/components/login/BrandPanel";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sign-in failed");
      setLoading(false);
    }
  };

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
