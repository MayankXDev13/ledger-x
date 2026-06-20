"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, CheckCircle2 } from "lucide-react";

interface PasswordResetFormProps {
  onSubmit: (email: string) => Promise<void>;
  isSent?: boolean;
  email?: string;
}

export function PasswordResetForm({
  onSubmit,
  isSent = false,
  email = "",
}: PasswordResetFormProps) {
  const [formData, setFormData] = useState({ email: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData.email);
  };

  if (isSent) {
    return (
      <div className="text-center space-y-6">
        <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto border border-emerald-500/20">
          <CheckCircle2 className="w-10 h-10 text-emerald-400" />
        </div>
        <div className="space-y-2">
          <p className="text-foreground font-medium">Email sent!</p>
          <p className="text-muted-foreground text-sm">
            We sent a password reset link to{" "}
            <span className="text-cyan-400 font-medium">{email}</span>
          </p>
        </div>
        <Button
          variant="outline"
          className="w-full"
          onClick={() => {
            setFormData({ email: "" });
            onSubmit(formData.email);
          }}
        >
          Send again
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="email">Email address</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={formData.email}
            onChange={(e) => setFormData({ email: e.target.value })}
            required
            className="h-11 pl-9 bg-muted/30 border-border/50 focus:border-cyan-500/50 transition-all"
          />
        </div>
      </div>

      <Button
        type="submit"
        className="w-full h-11 bg-linear-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-900 font-semibold transition-all"
      >
        Send reset link
      </Button>
    </form>
  );
}
