"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowUpRight,
  ArrowDownRight,
  StickyNote,
  Pencil,
  Trash2,
  Clock,
  Wallet,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { Transaction } from "@/lib/api";

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Math.abs(n));
}

interface TransactionItemProps {
  transaction: Transaction & { runningBalance?: number };
  onEdit: (tx: Transaction) => void;
  onDelete: (id: string) => void;
}

export function TransactionItem({
  transaction,
  onEdit,
  onDelete,
}: TransactionItemProps) {
  const isCredit = transaction.type === "credit";

  return (
    <div className="flex items-center gap-4 px-5 py-3.5 hover:bg-muted/20 transition-colors group relative">
      {/* Left: type icon */}
      <div
        className={cn(
          "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-105",
          isCredit
            ? "bg-emerald-500/12 text-emerald-400"
            : "bg-red-500/12 text-red-400"
        )}
      >
        {isCredit ? (
          <ArrowUpRight className="w-4 h-4" />
        ) : (
          <ArrowDownRight className="w-4 h-4" />
        )}
      </div>

      {/* Middle: info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Type badge */}
          <Badge
            variant="outline"
            className={cn(
              "text-[10px] px-1.5 py-0 h-4 font-semibold uppercase tracking-wider",
              isCredit
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                : "bg-red-500/10 text-red-400 border-red-500/20"
            )}
          >
            {isCredit ? "↑ Credit" : "↓ Debit"}
          </Badge>

          {/* Note */}
          {transaction.note && (
            <span className="text-xs text-muted-foreground flex items-center gap-1 truncate max-w-[200px]">
              <StickyNote className="w-3 h-3 shrink-0" />
              {transaction.note}
            </span>
          )}
        </div>

        {/* Timestamp + running balance */}
        <div className="flex items-center gap-3 mt-0.5 flex-wrap">
          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <Clock className="w-3 h-3" />
            {format(new Date(transaction.createdAt), "MMM d, yyyy • h:mm a")}
          </span>
          {transaction.runningBalance !== undefined && (
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <Wallet className="w-3 h-3" />
              Balance after:{" "}
              <span
                className={cn(
                  "font-semibold",
                  transaction.runningBalance >= 0
                    ? "text-emerald-500"
                    : "text-red-500"
                )}
              >
                {formatCurrency(transaction.runningBalance)}
              </span>
            </span>
          )}
        </div>
      </div>

      {/* Right: amount + actions */}
      <div className="flex items-center gap-2 shrink-0">
        <span
          className={cn(
            "text-base font-bold tabular",
            isCredit ? "text-emerald-400" : "text-red-400"
          )}
        >
          {isCredit ? "+" : "−"}
          {formatCurrency(transaction.amount)}
        </span>

        {/* Action buttons — reveal on hover */}
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all duration-150 translate-x-1 group-hover:translate-x-0">
          <Button
            variant="ghost"
            size="icon"
            className="w-7 h-7 text-muted-foreground hover:text-foreground hover:bg-muted"
            onClick={() => onEdit(transaction)}
            aria-label="Edit transaction"
          >
            <Pencil className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="w-7 h-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            onClick={() => onDelete(transaction.id)}
            aria-label="Delete transaction"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}