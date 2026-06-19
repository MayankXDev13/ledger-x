import { TrendingUp, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyTransactionsProps {
  onAdd: () => void;
}

export function EmptyTransactions({
  onAdd,
}: EmptyTransactionsProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-14 h-14 rounded-full bg-muted/30 flex items-center justify-center mb-3">
        <TrendingUp className="w-7 h-7 text-muted-foreground" />
      </div>

      <p className="font-medium text-foreground">
        No transactions yet
      </p>

      <p className="text-sm text-muted-foreground mt-1">
        Add the first transaction for this customer
      </p>

      <Button
        onClick={onAdd}
        className="mt-4 gap-2"
        size="sm"
      >
        <Plus className="w-4 h-4" />
        Add Transaction
      </Button>
    </div>
  );
}