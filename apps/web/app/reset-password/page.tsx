"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { LogoSection } from "@/components/reset-password/LogoSection";
import { UpdatePasswordForm } from "@/components/reset-password/UpdatePasswordForm";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleReset = async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Password updated successfully!");
      router.push("/login");
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