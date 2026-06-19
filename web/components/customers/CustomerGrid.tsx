import { Skeleton } from "@/components/ui/skeleton";
import CustomerCard from "./CustomerCard";
import type { Customer } from "@/lib/api";

interface CustomerGridProps {
  customers: Customer[];
  isLoading: boolean;
  onEdit: (customer: Customer) => void;
  onDelete: (id: string) => void;
}

export function CustomerGrid({
  customers,
  isLoading,
  onEdit,
  onDelete,
}: CustomerGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-36 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      {customers.map((customer) => (
        <CustomerCard
          key={customer.id}
          customer={customer}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}