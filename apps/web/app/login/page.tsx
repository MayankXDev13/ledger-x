"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { login } from "@/lib/auth";
import { BrandPanel } from "@/components/login/BrandPanel";
import { LoginForm } from "@/components/login/LoginForm";
import Link from "next/link";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLogin = async (email: string, password: string) => {
    try {
      await login(email, password);
      router.push("/dashboard");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Login failed");
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      <BrandPanel />
      <LoginForm onSubmit={handleLogin} />
    </div>
  );
}