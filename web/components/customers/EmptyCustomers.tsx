"use client";

import { Users, Plus, Sparkles, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyCustomersProps {
  search: string;
  onAdd: () => void;
}

export function EmptyCustomers({ search, onAdd }: EmptyCustomersProps) {
  if (search) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-14 h-14 rounded-2xl bg-muted border border-border flex items-center justify-center mb-4">
          <Users className="w-6 h-6 text-muted-foreground" />
        </div>
        <h3 className="text-sm font-semibold text-foreground mb-1">
          No results for &ldquo;{search}&rdquo;
        </h3>
        <p className="text-xs text-muted-foreground">
          Try a different name or phone number
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      {/* Illustration */}
      <div className="relative mb-6">
        <div className="absolute inset-0 rounded-full bg-cyan-500/10 scale-[2] blur-2xl" />
        <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-muted to-muted/50 border border-border flex items-center justify-center">
          <Users className="w-9 h-9 text-muted-foreground" />
          <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-gradient-brand flex items-center justify-center shadow-sm">
            <TrendingUp className="w-3 h-3 text-slate-900" />
          </div>
        </div>
      </div>

      <h3 className="text-base font-bold text-foreground mb-2">
        No customers yet
      </h3>
      <p className="text-sm text-muted-foreground max-w-[280px] leading-relaxed mb-6">
        Add your first customer to start managing their ledger, tracking payments, and building your business.
      </p>

      <Button
        onClick={onAdd}
        className="gap-2 bg-gradient-brand text-slate-900 font-semibold shadow-md shadow-cyan-500/20 hover:opacity-90"
        id="add-first-customer"
      >
        <Plus className="w-4 h-4" />
        Add First Customer
      </Button>

      {/* Feature hints */}
      <div className="mt-8 grid grid-cols-3 gap-4 max-w-xs">
        {[
          { label: "Track balances", icon: "📊" },
          { label: "Record payments", icon: "💳" },
          { label: "Export ledger", icon: "📄" },
        ].map((f) => (
          <div
            key={f.label}
            className="flex flex-col items-center gap-1.5 p-3 rounded-lg border border-border/50 bg-muted/20"
          >
            <span className="text-xl">{f.icon}</span>
            <span className="text-[10px] font-medium text-muted-foreground text-center leading-tight">
              {f.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}