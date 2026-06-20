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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";
import { CustomerDialog } from "@/components/customers/CustomerDialog";

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Math.abs(n));
}

function formatDate(dateStr: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(dateStr));
}

/* Generate a deterministic gradient from customer name */
function getAvatarGradient(name: string) {
  const gradients = [
    "from-cyan-400 to-blue-500",
    "from-emerald-400 to-teal-500",
    "from-violet-400 to-purple-500",
    "from-amber-400 to-orange-500",
    "from-rose-400 to-pink-500",
    "from-sky-400 to-cyan-500",
  ];
  const index =
    name.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) %
    gradients.length;
  return gradients[index];
}

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
  const avatarGradient = getAvatarGradient(customer.name);

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
              ? "bg-linear-to-br from-emerald-400 to-cyan-400"
              : isPayable
                ? "bg-linear-to-br from-red-400 to-orange-400"
                : "bg-linear-to-br from-zinc-400 to-zinc-500"
          )}
        />
        {/* Top accent line */}
        <div
          className={cn(
            "absolute top-0 left-0 right-0 h-px",
            isReceivable
              ? "bg-linear-to-r from-transparent via-emerald-500/40 to-transparent"
              : isPayable
                ? "bg-linear-to-r from-transparent via-red-500/40 to-transparent"
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
                  avatarGradient
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
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full",
                      isReceivable
                        ? "chip-receivable"
                        : isPayable
                          ? "chip-payable"
                          : "chip-settled"
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
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-3 mt-2">
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Phone className="w-3.5 h-3.5 shrink-0" />
                    {customer.phone}
                  </span>
                  {/* Created date — use id-based mock for now */}
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Calendar className="w-3.5 h-3.5 shrink-0" />
                    Customer since {new Date().toLocaleDateString("en-IN", { month: "short", year: "numeric" })}
                  </span>
                </div>
              </div>
            </div>

            {/* Right — Balance + Actions */}
            <div className="flex flex-col items-start sm:items-end gap-3 sm:shrink-0">
              {/* Balance display */}
              <div className="flex flex-col sm:items-end gap-0.5">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Current Balance
                </span>
                <div
                  className={cn(
                    "text-3xl sm:text-4xl font-bold tabular tracking-tight",
                    isReceivable
                      ? "text-brand-light"
                      : isPayable
                        ? "text-red-400"
                        : "text-muted-foreground"
                  )}
                >
                  {formatCurrency(balance)}
                </div>
                <span
                  className={cn(
                    "text-xs font-medium",
                    isReceivable
                      ? "text-emerald-500"
                      : isPayable
                        ? "text-red-500"
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
                      className="h-8 w-8 border-border/60 hover:border-primary/40"
                    >
                      <MoreHorizontal className="w-3.5 h-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-44">
                    <DropdownMenuItem className="text-xs cursor-pointer">
                      Export transactions
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-xs cursor-pointer">
                      Send statement
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
