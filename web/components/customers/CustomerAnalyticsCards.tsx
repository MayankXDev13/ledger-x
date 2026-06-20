import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Scale, Hash } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Math.abs(n));
}

interface AnalyticsCardProps {
  label: string;
  value: string;
  sub?: string;
  icon: React.ElementType;
  iconClass: string;
  valueClass: string;
  bgClass: string;
  loading?: boolean;
}

function AnalyticsCard({
  label,
  value,
  sub,
  icon: Icon,
  iconClass,
  valueClass,
  bgClass,
  loading,
}: AnalyticsCardProps) {
  return (
    <div
      className={cn(
        "relative rounded-xl border border-border bg-card p-4 overflow-hidden group card-hover"
      )}
    >
      {/* Ambient bg */}
      <div
        className={cn(
          "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none",
          bgClass
        )}
      />
      {/* Top border accent */}
      <div
        className={cn(
          "absolute top-0 left-4 right-4 h-px opacity-50",
          bgClass
        )}
      />

      <div className="relative flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">
            {label}
          </p>
          {loading ? (
            <Skeleton className="h-7 w-24 mb-1" />
          ) : (
            <p className={cn("text-2xl font-bold tabular tracking-tight", valueClass)}>
              {value}
            </p>
          )}
          {sub && !loading && (
            <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>
          )}
        </div>

        <div
          className={cn(
            "w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
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
      sub: "Money received",
      icon: TrendingUp,
      iconClass: "bg-brand/15 text-brand-light",
      valueClass: "text-brand-light",
      bgClass: "bg-gradient-to-br from-brand/5 to-transparent",
      loading,
    },
    {
      label: "Total Debit",
      value: formatCurrency(totalDebit),
      sub: "Money paid out",
      icon: TrendingDown,
      iconClass: "bg-red-500/15 text-red-400",
      valueClass: "text-red-400",
      bgClass: "bg-gradient-to-br from-red-500/5 to-transparent",
      loading,
    },
    {
      label: "Net Balance",
      value: formatCurrency(netBalance),
      sub: netBalance >= 0 ? "Receivable" : "Payable",
      icon: Scale,
      iconClass:
        netBalance >= 0
          ? "bg-primary/15 text-primary"
          : "bg-amber-500/15 text-amber-400",
      valueClass:
        netBalance >= 0
          ? "text-primary"
          : "text-amber-400",
      bgClass:
        netBalance >= 0
          ? "bg-gradient-to-br from-primary/5 to-transparent"
          : "bg-gradient-to-br from-amber-500/5 to-transparent",
      loading,
    },
    {
      label: "Transactions",
      value: loading ? "—" : String(txCount),
      sub: "Total entries",
      icon: Hash,
      iconClass: "bg-violet-500/15 text-violet-400",
      valueClass: "text-foreground",
      bgClass: "bg-gradient-to-br from-violet-500/5 to-transparent",
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
