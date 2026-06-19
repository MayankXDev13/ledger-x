import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  TrendingDown,
  StickyNote,
  CalendarIcon,
  Pencil,
  Trash2,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { Transaction } from "@/lib/api";

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}

interface TransactionItemProps {
  transaction: Transaction;
  onEdit: (tx: Transaction) => void;
  onDelete: (id: string) => void;
}

export function TransactionItem({
  transaction,
  onEdit,
  onDelete,
}: TransactionItemProps) {
  return (
    <div className="flex items-center justify-between px-5 py-4 hover:bg-muted/20 transition-colors group">
      <div className="flex items-center gap-4 min-w-0">
        <div
          className={cn(
            "w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
            transaction.type === "credit"
              ? "bg-emerald-500/15 text-emerald-400"
              : "bg-red-500/15 text-red-400"
          )}
        >
          {transaction.type === "credit" ? (
            <TrendingUp className="w-4 h-4" />
          ) : (
            <TrendingDown className="w-4 h-4" />
          )}
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className={cn(
                "text-xs px-2 py-0",
                transaction.type === "credit"
                  ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/20"
                  : "bg-red-500/15 text-red-400 border-red-500/20"
              )}
            >
              {transaction.type}
            </Badge>

            {transaction.note && (
              <span className="text-xs text-muted-foreground truncate flex items-center gap-1">
                <StickyNote className="w-3 h-3" />
                {transaction.note}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 mt-0.5 text-xs text-muted-foreground">
            <CalendarIcon className="w-3 h-3" />
            {format(
              new Date(transaction.createdAt),
              "MMM d, yyyy · h:mm a"
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span
          className={cn(
            "text-base font-bold tabular-nums",
            transaction.type === "credit"
              ? "text-emerald-400"
              : "text-red-400"
          )}
        >
          {transaction.type === "credit" ? "+" : "-"}
          {formatCurrency(transaction.amount)}
        </span>

        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="w-7 h-7"
            onClick={() => onEdit(transaction)}
          >
            <Pencil className="w-3.5 h-3.5" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="w-7 h-7 text-muted-foreground hover:text-destructive"
            onClick={() => onDelete(transaction.id)}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}