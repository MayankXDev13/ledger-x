"use client";

import { cn } from "@/lib/utils";
import type { Customer } from "@/lib/api";
import {
  Phone,
  Calendar,
  MoreHorizontal,
  Pencil,
  Plus,
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";
import Link from "next/link";
import { CustomerDialog } from "@/components/customers/CustomerDialog";
import { useExportTransactions } from "@/hooks/useDataPortability";
import { formatCurrency } from "@/lib/format";
import { avatarGradient } from "@/lib/avatar";



interface CustomerProfileHeaderProps {
  customer: Customer;
  balance: number;
  onAddTransaction: () => void;
  onDelete: () => void;
}

export function CustomerProfileHeader({
  customer,
  balance,
  onAddTransaction,
  onDelete,
}: CustomerProfileHeaderProps) {
  const [editOpen, setEditOpen] = useState(false);
  const exportTransactions = useExportTransactions(customer.id);
  const avatarFill = avatarGradient(customer.name);

  const isReceivable = balance > 0;
  const isPayable = balance < 0;
  const isSettled = balance === 0;

  return (
    <>
      <div className="relative rounded-xl border border-border bg-card overflow-hidden">
        {/* Subtle ambient gradient */}
        <div
          className={cn(
            "absolute inset-0 opacity-[0.03] pointer-events-none",
            isReceivable
              ? "bg-linear-to-br from-brand to-brand-light"
              : isPayable
                ? "bg-linear-to-br from-destructive to-destructive/40"
                : "bg-linear-to-br from-zinc-400 to-zinc-500"
          )}
        />
        {/* Top accent line */}
        <div
          className={cn(
            "absolute top-0 left-0 right-0 h-px",
            isReceivable
              ? "bg-linear-to-r from-transparent via-primary/40 to-transparent"
              : isPayable
                ? "bg-linear-to-r from-transparent via-destructive/40 to-transparent"
                : "bg-linear-to-r from-transparent via-zinc-500/30 to-transparent"
          )}
        />

        <div className="relative p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-start gap-5 sm:gap-6">
            {/* Left — Avatar + Info */}
            <div className="flex items-start gap-4 flex-1 min-w-0">
              {/* Avatar */}
              <div
                className={cn(
                  "w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-linear-to-br flex items-center justify-center shrink-0 shadow-lg text-white text-2xl font-bold select-none",
                  avatarFill
                )}
                style={{ textShadow: "0 1px 2px rgba(0,0,0,0.3)" }}
              >
                {customer.name.charAt(0).toUpperCase()}
              </div>

              {/* Info */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
                    {customer.name}
                  </h1>
                  {/* Balance status pill */}
                  <Badge
                    variant="outline"
                    className={cn(
                      "font-semibold",
                      isReceivable
                        ? "border-primary/25 bg-primary/10 text-primary"
                        : isPayable
                          ? "border-border bg-muted text-muted-foreground"
                          : "border-positive/25 bg-positive/10 text-positive"
                    )}
                  >
                    {isReceivable ? (
                      <ArrowUpRight className="w-2.5 h-2.5" />
                    ) : isPayable ? (
                      <ArrowDownRight className="w-2.5 h-2.5" />
                    ) : (
                      <CheckCircle2 className="w-2.5 h-2.5" />
                    )}
                    {isReceivable
                      ? "Receivable"
                      : isPayable
                        ? "Payable"
                        : "Settled"}
                  </Badge>
                </div>

                <div className="flex flex-wrap items-center gap-3 mt-2">
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Phone className="w-3.5 h-3.5 shrink-0" />
                    {customer.phone}
                  </span>
                  {/* Created date */}
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Calendar className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    {customer.createdAt
                      ? `Customer since ${new Date(customer.createdAt).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}`
                      : "Customer since —"}
                  </span>
                </div>
              </div>
            </div>

            {/* Right — Balance + Actions */}
            <div className="flex flex-col items-start sm:items-end gap-3 sm:shrink-0">
              {/* Balance display */}
              <div className="flex flex-col sm:items-end gap-0.5">
                <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Current Balance
                </span>
                <div
                  className={cn(
                    "text-3xl sm:text-4xl font-bold tabular-nums tracking-tight",
                    isReceivable
                      ? "text-brand-text"
                      : isPayable
                        ? "text-destructive"
                        : "text-muted-foreground"
                  )}
                >
                  {formatCurrency(balance)}
                </div>
                <span
                  className={cn(
                    "text-xs font-medium",
                    isReceivable
                      ? "text-brand-text"
                      : isPayable
                        ? "text-destructive"
                        : "text-muted-foreground"
                  )}
                >
                  {isReceivable
                    ? "▲ Receivable from customer"
                    : isPayable
                      ? "▼ Payable to customer"
                      : "✓ All settled"}
                </span>
              </div>

              {/* Quick actions */}
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  className="h-8 gap-1.5 text-xs bg-gradient-brand text-primary-foreground font-bold shadow-sm shadow-primary/20 hover:opacity-90"
                  onClick={onAddTransaction}
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Transaction
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 gap-1.5 text-xs border-border/60 hover:border-primary/40"
                  onClick={() => setEditOpen(true)}
                >
                  <Pencil className="w-3.5 h-3.5" />
                  Edit
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      size="icon"
                      variant="outline"
                      className="size-11 sm:size-9 border-border/60 hover:border-primary/40"
                      aria-label={`More actions for ${customer.name}`}
                    >
                      <MoreHorizontal className="w-3.5 h-3.5" aria-hidden="true" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-44">
                    <DropdownMenuItem
                      className="text-xs cursor-pointer"
                      onClick={() => exportTransactions.mutate()}
                    >
                      Export transactions
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="text-xs cursor-pointer">
                      <Link href={`/customers/statement?id=${customer.id}`}>
                        View statement
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-xs text-destructive focus:text-destructive cursor-pointer"
                      onClick={onDelete}
                    >
                      Delete customer
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </div>
      </div>

      <CustomerDialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        customer={customer}
      />
    </>
  );
}
