import { Users, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyCustomersProps {
  search: string;
  onAdd: () => void;
}

export function EmptyCustomers({
  search,
  onAdd,
}: EmptyCustomersProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center mb-4">
        <Users className="w-8 h-8 text-muted-foreground" />
      </div>

      <h3 className="font-semibold">
        {search ? "No customers found" : "No customers yet"}
      </h3>

      <p className="text-sm text-muted-foreground mt-1">
        {search
          ? "Try a different search term"
          : "Add your first customer to get started"}
      </p>

      {!search && (
        <Button onClick={onAdd} className="mt-4 gap-2">
          <Plus className="w-4 h-4" />
          Add Customer
        </Button>
      )}
    </div>
  );
}