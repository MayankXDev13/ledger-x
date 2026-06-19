"use client";

import { ReceiptText, Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyTransactionsProps {
  onAdd: () => void;
}

export function EmptyTransactions({ onAdd }: EmptyTransactionsProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      {/* Illustration ring */}
      <div className="relative mb-5">
        {/* Outer glow ring */}
        <div className="absolute inset-0 rounded-full bg-cyan-500/10 scale-150 blur-xl" />
        {/* Icon container */}
        <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-muted to-muted/50 border border-border flex items-center justify-center">
          <ReceiptText className="w-7 h-7 text-muted-foreground" />
          {/* Sparkle accent */}
          <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-gradient-brand flex items-center justify-center shadow-sm">
            <Sparkles className="w-2.5 h-2.5 text-slate-900" />
          </div>
        </div>
      </div>

      <h3 className="text-sm font-semibold text-foreground mb-1">
        No transactions yet
      </h3>
      <p className="text-xs text-muted-foreground max-w-[220px] leading-relaxed mb-5">
        Start tracking payments for this customer. Every entry builds your ledger.
      </p>

      <Button
        onClick={onAdd}
        size="sm"
        className="gap-2 bg-gradient-brand text-slate-900 font-semibold text-xs shadow-sm shadow-cyan-500/20 hover:opacity-90"
        id="add-first-transaction"
      >
        <Plus className="w-3.5 h-3.5" />
        Add First Transaction
      </Button>
    </div>
  );
}