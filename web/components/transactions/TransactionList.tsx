import { Skeleton } from "@/components/ui/skeleton";
import type { Transaction } from "@/lib/api";
import { TransactionItem } from "./TransactionItem";
import { EmptyTransactions } from "./EmptyTransactions";

interface TransactionListProps {
  loading: boolean;
  transactions: Transaction[];
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
      <div className="p-6 space-y-3">
        {[...Array(5)].map((_, i) => (
          <Skeleton
            key={i}
            className="h-14 rounded-lg"
          />
        ))}
      </div>
    );
  }

  if (!transactions.length) {
    return <EmptyTransactions onAdd={onAdd} />;
  }

  return (
    <div>
      {transactions.map((tx, index) => (
        <div
          key={tx.id}
          className={
            index !== 0
              ? "border-t border-border/30"
              : ""
          }
        >
          <TransactionItem
            transaction={tx}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        </div>
      ))}
    </div>
  );
}