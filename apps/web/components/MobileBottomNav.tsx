"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { LayoutDashboard, Users, HandCoins, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { avatarInitials, deriveFirstName } from "@/lib/name";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const items = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard", exact: true },
  { href: "/customers", icon: Users, label: "Customers", exact: false },
  { href: "/collection", icon: HandCoins, label: "Collect", exact: false },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [accountOpen, setAccountOpen] = useState(false);

  const firstName = deriveFirstName(user?.name, user?.email);
  const displayName = user?.name?.trim() || firstName;
  const initials = avatarInitials(user?.email);

  const handleSignOut = async () => {
    await signOut();
    setAccountOpen(false);
    toast.success("Signed out successfully");
    router.push("/login");
  };

  const isActive = (href: string, exact: boolean) => {
    if (exact) return pathname === href;
    return pathname === href || pathname.startsWith(href + "/");
  };

  return (
    <>
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-background/90 backdrop-blur-xl border-t border-border"
        role="navigation"
        aria-label="Mobile navigation"
      >
        <div className="flex items-center justify-around px-2 py-1.5 safe-area-bottom">
          {items.map(({ href, icon: Icon, label, exact }) => {
            const active = isActive(href, exact);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all duration-150",
                  active
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
                aria-current={active ? "page" : undefined}
              >
                <div className="relative">
                  <Icon
                    className={cn("w-5 h-5", active && "drop-shadow-[0_0_8px_var(--primary)]")}
                  />
                  {active && (
                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
                  )}
                </div>
                <span
                  className={cn(
                    "text-[10px] font-semibold",
                    active ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  {label}
                </span>
              </Link>
            );
          })}

          {/* Account entry (replaces the removed /profile link) */}
          <button
            onClick={() => setAccountOpen(true)}
            aria-expanded={accountOpen}
            aria-haspopup="dialog"
            className={cn(
              "flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all duration-150",
              accountOpen
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <div className="relative">
              <Avatar className="w-5 h-5">
                {user?.image && <AvatarImage src={user.image} alt={firstName} />}
                <AvatarFallback className="text-[8px] font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              {accountOpen && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
              )}
            </div>
            <span
              className={cn(
                "text-[10px] font-semibold",
                accountOpen ? "text-primary" : "text-muted-foreground"
              )}
            >
              {firstName}
            </span>
          </button>
        </div>
      </nav>

      {/* Account sheet */}
      <Sheet open={accountOpen} onOpenChange={setAccountOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl">
          <div className="flex items-center gap-4 px-6 pt-6">
            <Avatar className="w-12 h-12 border border-border">
              {user?.image && (
                <AvatarImage src={user.image} alt={displayName} />
              )}
              <AvatarFallback className="bg-gradient-brand text-primary-foreground text-sm font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col min-w-0">
              <SheetTitle className="truncate">{displayName}</SheetTitle>
              <SheetDescription className="truncate">
                {user?.email}
              </SheetDescription>
            </div>
          </div>
          <SheetFooter className="pt-4 pb-6 gap-2">
            <Link
              href="/settings"
              onClick={() => setAccountOpen(false)}
              className="flex items-center justify-center gap-2 h-9 rounded-md border border-border/60 text-xs font-semibold text-foreground hover:bg-muted/40 transition-colors"
            >
              <Settings className="w-3.5 h-3.5" />
              Account &amp; data settings
            </Link>
            <Button
              variant="destructive"
              className="w-full"
              onClick={handleSignOut}
            >
              Sign out
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}
