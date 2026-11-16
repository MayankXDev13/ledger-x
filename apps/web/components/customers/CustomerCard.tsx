"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import type { Customer } from "@/lib/api";
import { cn } from "@/lib/utils";
import { avatarGradient } from "@/lib/avatar";
import { formatCurrency } from "@/lib/format";
import { oldestUnpaidLabel } from "@/lib/labels";
import { balanceTone } from "@/lib/money";

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
      {/* Avatar + name + balance share one link target; actions sit outside it */}
      <Link
        href={`/customers/detail?id=${customer.id}`}
        className="flex items-center gap-3.5 flex-1 min-w-0 group"
      >
        <div
          className={cn(
            "size-10 rounded-lg bg-gradient-to-br flex items-center justify-center shrink-0 text-white font-bold text-base shadow-sm",
            gradient
          )}
          aria-hidden="true"
        >
          {customer.name.charAt(0).toUpperCase()}
        </div>

        <div className="flex flex-col gap-0.5 min-w-0 flex-1">
          {/* First line — the name owns the width so it stays identifiable */}
          <div className="flex min-w-0">
            <h3 className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
              {customer.name}
            </h3>
          </div>

          {/* Second line — amount and full aging phrase, phone intentionally omitted */}
          {hasBalance ? (
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <span className="text-sm font-bold text-foreground tabular-nums">
                {formatCurrency(balance.outstanding)}
              </span>
              <span
                className={cn(
                  "text-[11px] font-medium whitespace-nowrap",
                  balanceTone(balance.ageDays) === "danger"
                    ? "text-destructive"
                    : "text-muted-foreground"
                )}
              >
                {balance.ageDays === null
                  ? "Unpaid"
                  : oldestUnpaidLabel(balance.ageDays)}
              </span>
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
          className="size-11 text-muted-foreground hover:text-foreground hover:bg-muted"
          onClick={() => onEdit(customer)}
          aria-label={`Edit ${customer.name}`}
        >
          <Pencil className="w-3.5 h-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="size-11 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          onClick={() => onDelete(customer.id)}
          aria-label={`Delete ${customer.name}`}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}
