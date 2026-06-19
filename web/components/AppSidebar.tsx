"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Tags,
  TrendingUp,
  User,
  LogOut,
  Settings,
  ChevronRight,
  BarChart3,
  ArrowLeftRight,
  Building2,
  ChevronDown,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { useCustomers } from "@/hooks/useCustomers";

const navItems = [
  {
    href: "/dashboard",
    icon: LayoutDashboard,
    label: "Dashboard",
    exact: true,
  },
  {
    href: "/customers",
    icon: Users,
    label: "Customers",
    exact: false,
  },
  {
    href: "/tags",
    icon: Tags,
    label: "Tags",
    exact: false,
  },
];

const secondaryItems = [
  {
    href: "/profile",
    icon: Settings,
    label: "Settings",
    exact: false,
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const router = useRouter();
  const { data: customers } = useCustomers();
  const [collapsed, setCollapsed] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    toast.success("Signed out successfully");
    router.push("/login");
  };

  const initials = user?.email
    ? user.email.slice(0, 2).toUpperCase()
    : "LX";

  const emailName = user?.email?.split("@")[0] ?? "Account";
  const emailDomain = user?.email?.split("@")[1] ?? "";

  const isActive = (href: string, exact: boolean) => {
    if (exact) return pathname === href;
    return pathname === href || pathname.startsWith(href + "/");
  };

  return (
    <aside
      className={cn(
        "flex flex-col min-h-screen bg-sidebar border-r border-sidebar-border shrink-0 transition-all duration-300 ease-in-out relative",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="h-14 flex items-center justify-between px-3 border-b border-sidebar-border relative">
        <div className={cn("flex items-center gap-3 min-w-0", collapsed && "justify-center w-full")}>
          <div className="w-8 h-8 shrink-0 bg-gradient-brand rounded-lg flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <TrendingUp className="w-4 h-4 text-slate-900" />
          </div>
          {!collapsed && (
            <span className="text-base font-bold text-sidebar-foreground tracking-tight whitespace-nowrap">
              Ledger<span className="text-cyan-400">-X</span>
            </span>
          )}
        </div>

        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <button
              onClick={() => setCollapsed(!collapsed)}
              className={cn(
                "transition-all shrink-0 flex items-center justify-center cursor-pointer",
                collapsed
                  ? "absolute -right-3.5 top-3.5 z-50 w-7 h-7 rounded-full border border-sidebar-border bg-sidebar text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent shadow-md"
                  : "p-1.5 rounded-md text-sidebar-foreground/40 hover:text-sidebar-foreground hover:bg-sidebar-accent"
              )}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? (
                <PanelLeftOpen className="w-4 h-4" />
              ) : (
                <PanelLeftClose className="w-4 h-4" />
              )}
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">
            {collapsed ? "Expand" : "Collapse"}
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Workspace badge */}
      {!collapsed && (
        <div className="px-3 py-2 border-b border-sidebar-border">
          <button className="flex items-center gap-2 w-full px-2 py-1.5 rounded-md hover:bg-sidebar-accent transition-all group text-left">
            <div className="w-5 h-5 rounded-md bg-gradient-brand flex items-center justify-center shrink-0">
              <Building2 className="w-3 h-3 text-slate-900" />
            </div>
            <span className="text-xs font-medium text-sidebar-foreground/70 truncate flex-1">
              My Business
            </span>
            <ChevronDown className="w-3 h-3 text-sidebar-foreground/40 group-hover:text-sidebar-foreground/60 transition-colors" />
          </button>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 py-3 px-2 space-y-0.5">
        {/* Section label */}
        {!collapsed && (
          <p className="text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/30 px-2 pb-1 pt-1">
            Main
          </p>
        )}

        {navItems.map(({ href, icon: Icon, label, exact }) => {
          const active = isActive(href, exact);
          const isCustomers = href === "/customers";
          return (
            <Tooltip key={href} delayDuration={0}>
              <TooltipTrigger asChild>
                <Link
                  href={href}
                  className={cn(
                    "flex items-center gap-3 px-2.5 py-2 rounded-lg transition-all duration-150 group relative",
                    collapsed && "justify-center px-0",
                    active
                      ? "bg-cyan-500/10 text-cyan-400"
                      : "text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                  )}
                  aria-current={active ? "page" : undefined}
                >
                  {/* Active indicator bar */}
                  {active && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-cyan-400 rounded-full" />
                  )}

                  <Icon
                    className={cn(
                      "w-4 h-4 shrink-0",
                      active ? "text-cyan-400" : ""
                    )}
                  />

                  {!collapsed && (
                    <>
                      <span className="text-sm font-medium flex-1">{label}</span>
                      {isCustomers && customers && customers.length > 0 && (
                        <Badge
                          className={cn(
                            "text-[10px] px-1.5 py-0 h-4 font-semibold",
                            active
                              ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/30"
                              : "bg-muted text-muted-foreground border-border"
                          )}
                          variant="outline"
                        >
                          {customers.length}
                        </Badge>
                      )}
                      {active && (
                        <ChevronRight className="w-3 h-3 opacity-40" />
                      )}
                    </>
                  )}
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right" className={collapsed ? "" : "hidden"}>
                {label}
              </TooltipContent>
            </Tooltip>
          );
        })}

        {/* Secondary section */}
        {!collapsed && (
          <p className="text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/30 px-2 pb-1 pt-3">
            Account
          </p>
        )}
        {secondaryItems.map(({ href, icon: Icon, label, exact }) => {
          const active = isActive(href, exact);
          return (
            <Tooltip key={href} delayDuration={0}>
              <TooltipTrigger asChild>
                <Link
                  href={href}
                  className={cn(
                    "flex items-center gap-3 px-2.5 py-2 rounded-lg transition-all duration-150 group relative",
                    collapsed && "justify-center px-0",
                    active
                      ? "bg-cyan-500/10 text-cyan-400"
                      : "text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                  )}
                >
                  {active && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-cyan-400 rounded-full" />
                  )}
                  <Icon className="w-4 h-4 shrink-0" />
                  {!collapsed && (
                    <span className="text-sm font-medium flex-1">{label}</span>
                  )}
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right" className={collapsed ? "" : "hidden"}>
                {label}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </nav>

      {/* User section */}
      <div className="p-2 border-t border-sidebar-border">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={cn(
                "flex items-center gap-2.5 w-full px-2 py-2 rounded-lg hover:bg-sidebar-accent transition-all group text-left",
                collapsed && "justify-center"
              )}
            >
              <Avatar className="w-7 h-7 shrink-0 border border-cyan-500/30">
                <AvatarFallback className="bg-gradient-brand text-slate-900 text-xs font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              {!collapsed && (
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-xs font-semibold text-sidebar-foreground truncate">
                    {emailName}
                  </span>
                  <span className="text-[10px] text-sidebar-foreground/40 truncate">
                    @{emailDomain}
                  </span>
                </div>
              )}
              {!collapsed && (
                <ChevronDown className="w-3 h-3 text-sidebar-foreground/30 group-hover:text-sidebar-foreground/50" />
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            side={collapsed ? "right" : "top"}
            className="w-56"
          >
            <div className="px-2 py-1.5 border-b border-border mb-1">
              <p className="text-xs font-semibold text-foreground">{emailName}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
            <DropdownMenuItem asChild>
              <Link href="/profile" className="cursor-pointer">
                <User className="w-4 h-4 mr-2" />
                Profile & Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleSignOut}
              className="text-destructive focus:text-destructive cursor-pointer"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
}
