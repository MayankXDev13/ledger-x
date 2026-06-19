"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  ArrowLeftRight,
  Tags,
  TrendingUp,
  User,
  LogOut,
  Settings,
  ChevronRight,
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

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/customers", icon: Users, label: "Customers" },
  { href: "/tags", icon: Tags, label: "Tags" },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    toast.success("Signed out");
    router.push("/login");
  };

  const initials = user?.email
    ? user.email.slice(0, 2).toUpperCase()
    : "LX";

  return (
    <aside className="flex flex-col w-16 lg:w-64 min-h-screen bg-sidebar border-r border-sidebar-border shrink-0 transition-all duration-300">
      {/* Logo */}
      <div className="h-16 flex items-center gap-3 px-3 lg:px-5 border-b border-sidebar-border">
        <div className="w-9 h-9 shrink-0 bg-linear-to-br from-cyan-400 to-emerald-500 rounded-lg flex items-center justify-center shadow-md shadow-cyan-500/20">
          <TrendingUp className="w-4 h-4 text-slate-900" />
        </div>
        <span className="hidden lg:block text-lg font-bold text-sidebar-foreground tracking-tight">
          Ledger<span className="text-cyan-400">-X</span>
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-2 lg:px-3 space-y-1">
        {navItems.map(({ href, icon: Icon, label }) => {
          const active =
            pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Tooltip key={href} delayDuration={0}>
              <TooltipTrigger asChild>
                <Link
                  href={href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 group",
                    active
                      ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  <span className="hidden lg:block text-sm font-medium">{label}</span>
                  {active && (
                    <ChevronRight className="w-3 h-3 ml-auto hidden lg:block opacity-60" />
                  )}
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right" className="lg:hidden">
                {label}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </nav>

      {/* User section */}
      <div className="p-2 lg:p-3 border-t border-sidebar-border">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-3 w-full px-2 py-2 rounded-lg hover:bg-sidebar-accent transition-all group">
              <Avatar className="w-8 h-8 shrink-0 border border-cyan-500/30">
                <AvatarFallback className="bg-linear-to-br from-cyan-500 to-emerald-500 text-slate-900 text-xs font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="hidden lg:flex flex-col min-w-0 text-left">
                <span className="text-xs font-medium text-sidebar-foreground truncate">
                  {user?.email}
                </span>
                <span className="text-xs text-sidebar-foreground/50">Account</span>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="right" className="w-56">
            <DropdownMenuItem asChild>
              <Link href="/profile" className="cursor-pointer">
                <User className="w-4 h-4 mr-2" />
                Profile
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
