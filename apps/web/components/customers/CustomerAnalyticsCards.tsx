import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Scale, Hash } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/format";


interface AnalyticsCardProps {
  label: string;
  value: string;
  sub?: string;
  icon: React.ElementType;
  iconClass: string;
  valueClass: string;
  bgClass?: string;
  loading?: boolean;
}

function AnalyticsCard({
  label,
  value,
  sub,
  icon: Icon,
  iconClass,
  valueClass,
  loading,
}: AnalyticsCardProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-muted-foreground mb-1.5">
            {label}
          </p>
          {loading ? (
            <Skeleton className="h-7 w-24 mb-1" />
          ) : (
            <p className={cn("text-xl sm:text-2xl font-bold tabular-nums tracking-tight", valueClass)}>
              {value}
            </p>
          )}
          {sub && !loading && (
            <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
          )}
        </div>

        <div
          className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
            iconClass
          )}
        >
          <Icon className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
}

interface CustomerAnalyticsCardsProps {
  totalCredit: number;
  totalDebit: number;
  netBalance: number;
  txCount: number;
  loading: boolean;
}

export function CustomerAnalyticsCards({
  totalCredit,
  totalDebit,
  netBalance,
  txCount,
  loading,
}: CustomerAnalyticsCardsProps) {
  const cards: AnalyticsCardProps[] = [
    {
      label: "Total Credit",
      value: formatCurrency(totalCredit),
      sub: "Credit given",
      icon: TrendingUp,
      iconClass: "bg-brand/15 text-brand-text",
      valueClass: "text-foreground",
      bgClass: "bg-gradient-to-br from-brand/5 to-transparent",
      loading,
    },
    {
      label: "Total Paid",
      value: formatCurrency(totalDebit),
      sub: "Payment received",
      icon: TrendingDown,
      iconClass: "bg-positive/15 text-positive",
      valueClass: "text-positive",
      bgClass: "bg-gradient-to-br from-positive/5 to-transparent",
      loading,
    },
    {
      label: "Net Balance",
      value: formatCurrency(netBalance),
      sub: netBalance >= 0 ? "Receivable" : "Payable",
      icon: Scale,
      iconClass:
        netBalance >= 0
          ? "bg-brand/15 text-brand-text"
          : "bg-destructive/15 text-destructive",
      valueClass: "text-foreground",
      bgClass:
        netBalance >= 0
          ? "bg-gradient-to-br from-brand/5 to-transparent"
          : "bg-gradient-to-br from-destructive/5 to-transparent",
      loading,
    },
    {
      label: "Transactions",
      value: loading ? "—" : String(txCount),
      sub: "Total entries",
      icon: Hash,
      iconClass: "bg-muted text-muted-foreground",
      valueClass: "text-foreground",
      bgClass: "bg-gradient-to-br from-muted/30 to-transparent",
      loading,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map((card) => (
        <AnalyticsCard key={card.label} {...card} />
      ))}
    </div>
  );
}
