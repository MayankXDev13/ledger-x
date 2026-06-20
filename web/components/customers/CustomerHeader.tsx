import { Card, CardContent } from "@/components/ui/card";
import { Phone } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Customer } from "@/lib/api";

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}

interface CustomerHeaderProps {
  customer: Customer;
  balance: number;
}

export function CustomerHeader({ customer, balance }: CustomerHeaderProps) {
  return (
    <Card className="border-border/50 bg-card/80 overflow-hidden relative">
      <div className="absolute inset-0 bg-linear-to-br from-primary/5 to-primary/3" />

      <CardContent className="relative pt-6 pb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-brand flex items-center justify-center shadow-lg shadow-primary/20 text-primary-foreground text-xl font-bold">
              {customer.name.charAt(0).toUpperCase()}
            </div>

            <div>
              <h1 className="text-2xl font-bold">{customer.name}</h1>

              <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                <Phone className="w-3.5 h-3.5" />
                {customer.phone}
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1">
            <div className="text-xs text-muted-foreground">Current Balance</div>

            <div
              className={cn(
                "text-2xl font-bold tabular-nums",
                balance >= 0 ? "text-brand-light" : "text-red-400",
              )}
            >
              {balance >= 0 ? "+" : ""}
              {formatCurrency(balance)}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
