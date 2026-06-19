import Link from "next/link";
import { Button } from "@/components/ui/button";
import { User, Phone, Pencil, Trash2 } from "lucide-react";
import { Customer } from "@/lib/api";



interface CustomerCardProps {
  customer: Customer;
  onEdit: (customer: Customer) => void;
  onDelete: (id: string) => void;
}

export default function CustomerCard({
  customer,
  onEdit,
  onDelete,
}: CustomerCardProps) {
  return (
    <Link href={`/customers/${customer.id}`}>
      <div className="group relative flex flex-col gap-3 p-5 rounded-xl border border-border/50 bg-card/80 hover:border-cyan-500/30 hover:shadow-lg hover:shadow-cyan-500/5 transition-all duration-300">
        {/* Subtle glow on hover */}
        <div className="absolute inset-0 rounded-xl bg-linear-to-br from-cyan-500/0 to-emerald-500/0 group-hover:from-cyan-500/3 group-hover:to-emerald-500/3 transition-all duration-300" />

        <div className="relative flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-linear-to-br from-cyan-500/20 to-emerald-500/20 border border-cyan-500/20 flex items-center justify-center">
              <User className="w-5 h-5 text-cyan-400" />
            </div>

            <div>
              <h3 className="font-semibold text-foreground">
                {customer.name}
              </h3>

              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                <Phone className="w-3 h-3" />
                {customer.phone}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              className="w-7 h-7 text-muted-foreground hover:text-foreground"
              onClick={(e) => {
                e.preventDefault();
                onEdit(customer);
              }}
            >
              <Pencil className="w-3.5 h-3.5" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="w-7 h-7 text-muted-foreground hover:text-destructive"
              onClick={(e) => {
                e.preventDefault();
                onDelete(customer.id);
              }}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </Link>
  );
}