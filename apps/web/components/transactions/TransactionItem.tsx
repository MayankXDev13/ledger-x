"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowDown,
  ArrowUp,
  Clock,
  Pencil,
  StickyNote,
  Trash2,
  Wallet,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { Transaction } from "@/lib/api";
import { paymentMethodLabel } from "@/lib/payments";
import { formatCurrency } from "@/lib/format";
import { moneyPresentation, moneySurfaceClass, moneyTextClass } from "@/lib/money";

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
  const money = moneyPresentation(transaction);
  const isPayment = money.tone === "paid";
  const methodLabel = paymentMethodLabel(transaction.paymentMethod);

  return (
    <div
      className={cn(
        "flex items-center gap-4 px-5 py-3.5 hover:bg-muted/20 transition-colors group relative",
        isPayment && "bg-positive/[0.06]",
      )}
    >
      {/* Left: type icon */}
      <div
        className={cn(
          "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border",
          moneySurfaceClass(money.tone),
        )}
      >
        {isPayment ? (
          <Wallet className="w-4 h-4" />
        ) : money.tone === "credit" ? (
          <ArrowUp className="w-4 h-4" />
        ) : (
          <ArrowDown className="w-4 h-4" />
        )}
      </div>

      {/* Middle: info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Type badge */}
          <Badge
            variant="outline"
            className={cn(
              "px-2 py-0.5 min-h-[20px] font-semibold tracking-wide text-xs inline-flex items-center",
              isPayment
                ? "bg-positive/10 text-positive border-positive/25"
                : money.tone === "overdue"
                  ? "bg-destructive/10 text-destructive border-destructive/25"
                  : "bg-muted text-foreground border-border",
            )}
          >
            {isPayment
              ? `Payment · ${methodLabel}`
              : money.tone === "credit"
                ? "↑ Credit"
                : "↓ Debit"}
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
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            {format(new Date(transaction.createdAt), "MMM d, yyyy • h:mm a")}
          </span>
          {transaction.runningBalance !== undefined && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Wallet className="w-3 h-3" />
              Balance after:{" "}
              <span
                className={cn(
                  "font-semibold tabular-nums",
                  transaction.runningBalance >= 0
                    ? "text-foreground"
                    : "text-destructive",
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
            "text-base font-bold tabular-nums",
            moneyTextClass(money.tone),
          )}
        >
          {money.sign}
          {formatCurrency(transaction.amount)}
        </span>

        {/* Action buttons — always visible so touch and keyboard can reach them */}
        <div className="flex items-center gap-0.5">
          <Button
            variant="ghost"
            size="icon"
            className="size-11 sm:size-9 text-muted-foreground hover:text-foreground hover:bg-muted"
            onClick={() => onEdit(transaction)}
            aria-label="Edit transaction"
          >
            <Pencil className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-11 sm:size-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
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
