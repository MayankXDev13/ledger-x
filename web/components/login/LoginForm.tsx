"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Eye, EyeOff, ArrowRight, Loader2, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoginFormProps {
  onSubmit: (email: string, password: string) => Promise<void>;
}

export function LoginForm({ onSubmit }: LoginFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await onSubmit(email, password);
    setLoading(false);
  };

  return (
    <div className="flex flex-1 items-center justify-center p-8">
      <div className="w-full max-w-md space-y-8">
        <MobileBrandLogo />
        <div className="space-y-2">
          <h2 className="text-3xl font-bold text-foreground">Welcome back</h2>
          <p className="text-muted-foreground">Sign in to your account to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">
              Email address
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-11 bg-muted/30 border-border/50 focus:border-cyan-500/50 focus:ring-cyan-500/20 transition-all"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-sm font-medium">
                Password
              </Label>
              <Link
                href="/forgot-password"
                className="text-xs text-cyan-500 hover:text-cyan-400 transition-colors"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-11 pr-10 bg-muted/30 border-border/50 focus:border-cyan-500/50 focus:ring-cyan-500/20 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-11 bg-gradient-brand hover:opacity-90 text-primary-foreground font-semibold shadow-lg shadow-primary/20 transition-all hover:shadow-primary/30 hover:scale-[1.01]"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                Sign in
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-brand hover:text-brand-light font-medium transition-colors">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}

function MobileBrandLogo() {
  return (
    <div className="lg:hidden flex items-center gap-3 justify-center">
      <div className="w-10 h-10 bg-gradient-brand rounded-lg flex items-center justify-center">
        <TrendingUp className="w-5 h-5 text-white" />
      </div>
      <span className="text-xl font-bold text-foreground tracking-tight">Ledger-X</span>
    </div>
  );
}