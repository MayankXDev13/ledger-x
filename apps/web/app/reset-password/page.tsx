"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { resetPassword } from "@/lib/auth";
import { LogoSection } from "@/components/reset-password/LogoSection";
import { UpdatePasswordForm } from "@/components/reset-password/UpdatePasswordForm";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);

  const handleReset = async (password: string) => {
    const email = searchParams.get("email") ?? "";
    const token = searchParams.get("token") ?? "";
    if (!email || !token) {
      toast.error("This reset link is incomplete. Request a new one from Forgot password.");
      return;
    }
    setLoading(true);
    try {
      await resetPassword(email, token, password);
      toast.success("Password updated successfully! Please log in.");
      router.push("/login");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Reset failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-8">
      <div className="w-full max-w-md space-y-8">
        <LogoSection title="New password" subtitle="Choose a strong password" />

        <UpdatePasswordForm onSubmit={handleReset} />
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}