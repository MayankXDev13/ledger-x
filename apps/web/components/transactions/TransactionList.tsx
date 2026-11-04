import { Skeleton } from "@/components/ui/skeleton";
import type { Transaction } from "@/lib/api";
import { TransactionItem } from "./TransactionItem";
import { EmptyTransactions } from "./EmptyTransactions";

interface TransactionListProps {
  loading: boolean;
  transactions: (Transaction & { runningBalance?: number })[];
  onEdit: (tx: Transaction) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
}

export function TransactionList({
  loading,
  transactions,
  onEdit,
  onDelete,
  onAdd,
}: TransactionListProps) {
  if (loading) {
    return (
      <div className="divide-y divide-border/40">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-3.5">
            <Skeleton className="w-8 h-8 rounded-lg shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3.5 w-16" />
              <Skeleton className="h-2.5 w-32" />
            </div>
            <Skeleton className="h-5 w-20" />
          </div>
        ))}
      </div>
    );
  }

  if (!transactions.length) {
    return <EmptyTransactions onAdd={onAdd} />;
  }

  return (
    <div className="divide-y divide-border/40">
      {transactions.map((tx) => (
        <TransactionItem
          key={tx.id}
          transaction={tx}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}