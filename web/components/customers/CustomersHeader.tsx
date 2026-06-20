import { Button } from "@/components/ui/button";
import { Plus, Users } from "lucide-react";

interface CustomersHeaderProps {
  total: number;
  onAdd: () => void;
}

export function CustomersHeader({ total, onAdd }: CustomersHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-brand flex items-center justify-center shadow-sm shadow-primary/20">
          <Users className="w-4 h-4 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground tracking-tight">
            Customers
          </h1>
          <p className="text-xs text-muted-foreground">
            {total > 0 ? `${total} customer${total !== 1 ? "s" : ""}` : "No customers yet"}
          </p>
        </div>
      </div>

      <Button
        onClick={onAdd}
        id="add-customer-btn"
        className="gap-2 bg-gradient-brand text-primary-foreground font-semibold shadow-sm shadow-primary/20 hover:opacity-90 h-9"
      >
        <Plus className="w-4 h-4" />
        Add Customer
      </Button>
    </div>
  );
}