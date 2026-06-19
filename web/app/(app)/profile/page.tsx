"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  User,
  Mail,
  Lock,
  Shield,
  CheckCircle2,
  Loader2,
  LogOut,
  TrendingUp,
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwLoading, setPwLoading] = useState(false);

  const initials = user?.email
    ? user.email.slice(0, 2).toUpperCase()
    : "LX";

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    setPwLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setPwLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Password updated successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  return (
    <div className="flex flex-col gap-6 p-6 lg:p-8 max-w-3xl mx-auto w-full">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Profile</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your account settings
        </p>
      </div>

      {/* Profile Card */}
      <Card className="border-border/50 bg-card/80 overflow-hidden relative">
        <div className="absolute inset-0 bg-linear-to-br from-cyan-500/3 to-emerald-500/3" />
        <CardContent className="relative pt-6">
          <div className="flex items-center gap-5">
            <div className="relative">
              <Avatar className="w-20 h-20 border-2 border-cyan-500/30">
                <AvatarFallback className="bg-linear-to-br from-cyan-500 to-emerald-500 text-slate-900 text-2xl font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-linear-to-br from-cyan-400 to-emerald-500 rounded-full flex items-center justify-center border-2 border-background">
                <TrendingUp className="w-3 h-3 text-slate-900" />
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-foreground">
                  {user?.email?.split("@")[0] || "User"}
                </h2>
                <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/20 text-xs" variant="outline">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Verified
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5" />
                {user?.email}
              </p>
              {/* <p className="text-xs text-muted-foreground font-mono">
                ID: {user?.id?.slice(0, 16)}…
              </p> */}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account Details */}
      <Card className="border-border/50 bg-card/80">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <User className="w-4 h-4 text-cyan-400" />
            Account Details
          </CardTitle>
          <CardDescription>Your account information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Email address</Label>
            <div className="flex items-center gap-2">
              <Input
                value={user?.email ?? ""}
                disabled
                className="bg-muted/20 text-muted-foreground"
              />
              <Badge variant="outline" className="shrink-0 text-emerald-400 border-emerald-500/20">
                Verified
              </Badge>
            </div>
          </div>
          {/* <div className="space-y-2">
            <Label>User ID</Label>
            <Input
              value={user?.id ?? ""}
              disabled
              className="bg-muted/20 text-muted-foreground font-mono text-xs"
            />
          </div> */}
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card className="border-border/50 bg-card/80">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Lock className="w-4 h-4 text-cyan-400" />
            Change Password
          </CardTitle>
          <CardDescription>Update your account password</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                placeholder="Min. 8 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                className="bg-muted/20"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-pw">Confirm New Password</Label>
              <Input
                id="confirm-pw"
                type="password"
                placeholder="Repeat new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="bg-muted/20"
              />
            </div>
            <Button
              type="submit"
              disabled={pwLoading}
              className="bg-linear-to-r from-cyan-500 to-emerald-500 text-slate-900 font-semibold"
            >
              {pwLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Update password
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/20 bg-destructive/5">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2 text-destructive">
            <Shield className="w-4 h-4" />
            Session
          </CardTitle>
          <CardDescription>Sign out of your Ledger-X account</CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="destructive"
            onClick={handleSignOut}
            className="gap-2"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
