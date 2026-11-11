"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Phone, Pencil, Trash2 } from "lucide-react";
import type { Customer } from "@/lib/api";
import { cn } from "@/lib/utils";
import { avatarGradient } from "@/lib/avatar";
import { formatCurrency } from "@/lib/format";

interface CustomerCardProps {
  customer: Customer;
  balance?: { outstanding: number; ageDays: number | null };
  onEdit: (customer: Customer) => void;
  onDelete: (id: string) => void;
}

export default function CustomerCard({
  customer,
  balance,
  onEdit,
  onDelete,
}: CustomerCardProps) {
  const gradient = avatarGradient(customer.name);
  const hasBalance = !!balance && balance.outstanding > 0;

  return (
    <div className="relative flex items-center justify-between gap-3 p-4 rounded-xl border border-border bg-card hover:border-primary/40 transition-colors duration-150">
      {/* Avatar + identity + balance are the main link target */}
      <Link
        href={`/customers/detail?id=${customer.id}`}
        className="flex items-center gap-3.5 flex-1 min-w-0 group"
      >
        <div
          className={cn(
            "w-10 h-10 rounded-lg bg-gradient-to-br flex items-center justify-center shrink-0 text-white font-bold text-base shadow-sm",
            gradient
          )}
          aria-hidden="true"
        >
          {customer.name.charAt(0).toUpperCase()}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
            {customer.name}
          </h3>
          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
            <Phone className="w-3 h-3 shrink-0" aria-hidden="true" />
            <span className="truncate">{customer.phone}</span>
          </div>
        </div>

        {/* Balance column */}
        <div className="shrink-0 text-right pr-1">
          {hasBalance ? (
            <div>
              <p className="text-sm font-bold text-foreground tabular-nums">
                {formatCurrency(balance.outstanding)}
              </p>
              <p
                className={cn(
                  "text-[11px] font-medium mt-0.5",
                  balance.ageDays !== null && balance.ageDays > 60
                    ? "text-destructive"
                    : balance.ageDays !== null && balance.ageDays > 30
                      ? "text-destructive/80"
                      : "text-muted-foreground"
                )}
              >
                {balance.ageDays === null ? "Unpaid" : `Unpaid ${balance.ageDays}d`}
              </p>
            </div>
          ) : (
            <span className="text-xs text-muted-foreground font-medium">Settled</span>
          )}
        </div>
      </Link>

      {/* Actions — always visible for touch and keyboard accessibility */}
      <div className="shrink-0 flex items-center gap-0.5 border-l border-border/50 pl-2">
        <Button
          variant="ghost"
          size="icon"
          className="size-10 sm:size-8 text-muted-foreground hover:text-foreground hover:bg-muted"
          onClick={() => onEdit(customer)}
          aria-label={`Edit ${customer.name}`}
        >
          <Pencil className="w-3.5 h-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="size-10 sm:size-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          onClick={() => onDelete(customer.id)}
          aria-label={`Delete ${customer.name}`}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}
