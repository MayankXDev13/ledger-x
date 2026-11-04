"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import {
  FaChartBar,
  FaUsers,
  FaTags,
  FaArrowUp,
  FaUser,
  FaSignOutAlt,
  FaChevronRight,
  FaChevronDown,
  FaChevronLeft,
} from "react-icons/fa";
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
import { TrendingUp } from "lucide-react";

const navItems = [
  {
    href: "/dashboard",
    icon: FaChartBar,
    label: "Dashboard",
    exact: true,
  },
  {
    href: "/customers",
    icon: FaUsers,
    label: "Customers",
    exact: false,
  },
  {
    href: "/tags",
    icon: FaTags,
    label: "Tags",
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

  const initials = user?.email ? user.email.slice(0, 2).toUpperCase() : "LX";

  const emailName = user?.email?.split("@")[0] ?? "Account";
  const emailDomain = user?.email?.split("@")[1] ?? "";

  const isActive = (href: string, exact: boolean) => {
    if (exact) return pathname === href;
    return pathname === href || pathname.startsWith(href + "/");
  };

  return (
    <aside
      className={cn(
        "flex flex-col h-screen sticky top-0 bg-sidebar border-r border-sidebar-border shrink-0 transition-all duration-300 ease-in-out relative",
        collapsed ? "w-16" : "w-64",
      )}
    >
      {/* Logo */}
      <div
        className={cn(
          "h-14 flex items-center border-b border-sidebar-border relative",
          collapsed ? "justify-center" : "justify-between px-3",
        )}
      >
        <div
          className={cn(
            "flex items-center gap-3 min-w-0",
            collapsed && "justify-center",
          )}
        >
          <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center shadow-lg shadow-primary/25">
            <TrendingUp className="w-5 h-5 text-white font-bold" />
          </div>
          {!collapsed && (
            <span className="text-base font-bold text-sidebar-foreground tracking-tight whitespace-nowrap">
              Ledger<span className="text-primary">-X</span>
            </span>
          )}
        </div>
      </div>

      {/* Collapse/Expand toggle - outer middle edge */}
      <div className="absolute top-1/2 -translate-y-1/2 right-0 z-10">
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <button
              onClick={() => setCollapsed(!collapsed)}
              className={cn(
                "flex items-center justify-center",
                "w-5 h-10 rounded-r-md",
                "bg-sidebar text-sidebar-foreground/30",
                "hover:bg-sidebar-accent hover:text-sidebar-foreground",
                "transition-all duration-200 cursor-pointer",
              )}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? (
                <FaChevronRight className="w-2.5 h-2.5" />
              ) : (
                <FaChevronLeft className="w-2.5 h-2.5" />
              )}
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">
            {collapsed ? "Expand" : "Collapse"}
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Nav */}
      <nav
        className={cn("flex-1 py-3 space-y-0.5", collapsed ? "px-0" : "px-2")}
      >
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
                      ? "bg-primary/10 text-primary"
                      : "text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground",
                  )}
                  aria-current={active ? "page" : undefined}
                >
                  {/* Active indicator bar */}
                  {active && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-primary rounded-full" />
                  )}

                  <Icon
                    className={cn(
                      "w-4 h-4 shrink-0",
                      active ? "text-primary" : "",
                    )}
                  />

                  {!collapsed && (
                    <>
                      <span className="text-sm font-medium flex-1">
                        {label}
                      </span>
                      {isCustomers && customers && customers.length > 0 && (
                        <Badge
                          className={cn(
                            "text-[10px] px-1.5 py-0 h-4 font-semibold",
                            active
                              ? "bg-primary/20 text-primary border-primary/30"
                              : "bg-muted text-muted-foreground border-border",
                          )}
                          variant="outline"
                        >
                          {customers.length}
                        </Badge>
                      )}
                      {active && (
                        <FaChevronRight className="w-3 h-3 opacity-40" />
                      )}
                    </>
                  )}
                </Link>
              </TooltipTrigger>
              <TooltipContent
                side="right"
                className={collapsed ? "" : "hidden"}
              >
                {label}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </nav>

      {/* Profile section at bottom */}
      <div
        className={cn(
          "border-t border-sidebar-border",
          collapsed ? "p-0" : "p-2",
        )}
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={cn(
                "flex items-center gap-2.5 w-full px-2 py-2 rounded-lg hover:bg-sidebar-accent transition-all group text-left",
                collapsed && "justify-center",
              )}
            >
              <Avatar className="w-7 h-7 shrink-0 border border-primary/30">
                <AvatarFallback className="bg-gradient-brand text-primary-foreground text-xs font-bold">
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
                <FaChevronDown className="w-3 h-3 text-sidebar-foreground/30 group-hover:text-sidebar-foreground/50" />
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            side={collapsed ? "right" : "top"}
            className="w-56"
          >
            <div className="px-2 py-1.5 border-b border-border mb-1">
              <p className="text-xs font-semibold text-foreground">
                {emailName}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {user?.email}
              </p>
            </div>
            <DropdownMenuItem asChild>
              <Link href="/profile" className="cursor-pointer">
                <FaUser className="w-4 h-4 mr-2" />
                Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleSignOut}
              className="text-destructive focus:text-destructive cursor-pointer"
            >
              <FaSignOutAlt className="w-4 h-4 mr-2" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
}
