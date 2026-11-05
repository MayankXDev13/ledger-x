"use client";

import { useState } from "react";
import { signup } from "@/lib/auth";
import { LogoSection } from "@/components/signup/LogoSection";
import { SignupForm } from "@/components/signup/SignupForm";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSignup = async (email: string, password: string) => {
    try {
      await signup(email, password);
      toast.success("Account created!");
      router.push("/dashboard");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Signup failed");
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-8">
      <div className="w-full max-w-md space-y-8">
        <LogoSection title="Create account" subtitle="Join Ledger-X today" />

        <SignupForm onSubmit={handleSignup} />
      </div>
    </div>
  );
}