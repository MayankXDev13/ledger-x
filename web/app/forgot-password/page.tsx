"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { LogoSection } from "@/components/forgot-password/LogoSection";
import { PasswordResetForm } from "@/components/forgot-password/PasswordResetForm";
import { Button } from "@/components/ui/button";
import { Link } from "next/link";
import { ArrowLeft } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleReset = async (email: string) => {
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      setSent(true);
      setEmail(email);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-8">
      <div className="w-full max-w-md space-y-8">
        <LogoSection
          title="Reset password"
          subtitle={sent ? "Check your inbox" : "We'll send you a reset link"}
        />

        <PasswordResetForm
          onSubmit={handleReset}
          isSent={sent}
          email={email}
        />

        <div className="flex justify-center">
          <Link
            href="/login"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}