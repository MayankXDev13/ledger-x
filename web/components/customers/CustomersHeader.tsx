import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface CustomersHeaderProps {
  total: number;
  onAdd: () => void;
}

export function CustomersHeader({
  total,
  onAdd,
}: CustomersHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Customers
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {total} total customers
        </p>
      </div>

      <Button
        onClick={onAdd}
        className="gap-2 bg-linear-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-900 font-semibold"
      >
        <Plus className="w-4 h-4" />
        Add Customer
      </Button>
    </div>
  );
}