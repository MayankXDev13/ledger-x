"use client";

import {
  useDashboardAnalytics,
  useDashboardMetrics,
  useRecentTransactions,
} from "@/hooks/useDashboard";
import { useCustomers } from "@/hooks/useCustomers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Plus,
  ChevronRight,
  LayoutDashboard,
  HandCoins,
  Wallet,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import Link from "next/link";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  Legend,
} from "recharts";
import { useAuth } from "@/hooks/useAuth";
import { deriveFirstName } from "@/lib/name";
import { OnboardingFlow } from "@/components/onboarding/OnboardingFlow";
import { paymentMethodLabel } from "@/lib/payments";

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function monthLabel(month: string) {
  return format(new Date(`${month}-01T00:00:00Z`), "MMM yy");
}

/* ── Metric Card ── */
function MetricCard({
  title,
  value,
  icon: Icon,
  trend,
  trendLabel,
  accentColor,
  loading,
}: {
  title: string;
  value: string;
  icon: React.ElementType;
  trend?: "up" | "down" | "neutral";
  trendLabel?: string;
  accentColor: string; // "brand" | "positive" | "danger"
  loading?: boolean;
}) {
  const colorMap: Record<string, { bg: string; icon: string; ring: string }> = {
    brand: {
      bg: "from-primary/10 to-transparent",
      icon: "bg-primary/15 text-primary",
      ring: "border-primary/20",
    },
    positive: {
      bg: "from-[#34D399]/10 to-transparent",
      icon: "bg-[#34D399]/15 text-[#34D399]",
      ring: "border-[#34D399]/20",
    },
    danger: {
      bg: "from-[#E11D48]/10 to-transparent",
      icon: "bg-[#E11D48]/15 text-[#E11D48]",
      ring: "border-[#E11D48]/20",
    },
  };
  const colors = colorMap[accentColor] ?? colorMap.brand;

  return (
    <div
      className={cn(
        "relative rounded-xl border bg-card overflow-hidden group card-hover",
        colors.ring
      )}
    >
      <div
        className={cn(
          "absolute inset-0 bg-linear-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-300",
          colors.bg
        )}
      />
      <div className="relative p-5">
        <div className="flex items-start justify-between mb-3">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            {title}
          </p>
          <div
            className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center",
              colors.icon
            )}
          >
            <Icon className="w-4 h-4" />
          </div>
        </div>

        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-8 w-28" />
            <Skeleton className="h-3.5 w-20" />
          </div>
        ) : (
          <div>
            <p className="text-2xl font-bold text-foreground tabular font-mono tabular-nums">{value}</p>
            {trendLabel && (
              <div
                className={cn(
                  "flex items-center gap-1 mt-1 text-xs font-medium font-mono tabular-nums",
                  trend === "up"
                    ? "text-[#34D399]"
                    : trend === "down"
                      ? "text-[#E11D48]"
                      : "text-muted-foreground"
                )}
              >
                {trend === "up" ? (
                  <ArrowUpRight className="w-3 h-3" />
                ) : trend === "down" ? (
                  <ArrowDownRight className="w-3 h-3" />
                ) : null}
                {trendLabel}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Custom Tooltip ── */
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-xl text-xs">
      <p className="text-muted-foreground mb-1">{label}</p>
      <p className="font-bold text-foreground">
        {formatCurrency(Math.abs(payload[0].value))}
      </p>
    </div>
  );
}

/* ── Trend Tooltip (two series) ── */
function TrendTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-xl text-xs space-y-1">
      <p className="text-muted-foreground">
        {typeof label === "string" ? monthLabel(label) : label}
      </p>
      {payload.map((entry: any) => (
        <p
          key={entry.dataKey}
          className="font-semibold flex items-center justify-between gap-4"
          style={{ color: entry.color }}
        >
          <span>{entry.name}</span>
          <span className="tabular">{formatCurrency(entry.value ?? 0)}</span>
        </p>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const { data: metrics, isLoading: metricsLoading, refetch } = useDashboardMetrics();
  const { data: recentTxns, isLoading: txnsLoading } = useRecentTransactions();
  const { data: analytics, isLoading: analyticsLoading } = useDashboardAnalytics();
  const { data: customers } = useCustomers();
  const { user } = useAuth();

  // Real first name from the Google identity, falling back to the email
  // local-part, then "there" as the greeting placeholder.
  const firstName = user ? deriveFirstName(user.name, user.email) : "there";

  const chartData = recentTxns
    ? [...recentTxns].reverse().map((tx) => ({
        name: format(new Date(tx.createdAt), "MMM d"),
        amount: tx.type === "credit" ? tx.amount : -tx.amount,
        type: tx.type,
      }))
    : [];

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto w-full fade-up">
      {/* ─── Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-6 h-6 rounded-md bg-gradient-brand flex items-center justify-center">
              <LayoutDashboard className="w-3.5 h-3.5 text-primary-foreground" />
            </div>
            <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Overview
            </span>
          </div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            {getGreeting()},{" "}
            <span className="text-primary capitalize">{firstName}</span> 👋
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Here&apos;s your financial overview for today.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="gap-1.5 border-border/50 hover:border-primary/40 text-xs h-8"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </Button>
          <Link href="/customers">
            <Button
              size="sm"
              className="gap-1.5 bg-gradient-brand text-primary-foreground font-semibold text-xs h-8 shadow-sm shadow-primary/20 hover:opacity-90"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Customer
            </Button>
          </Link>
        </div>
      </div>

      {/* ─── Metric Cards ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          title="Total Balance"
          value={metrics ? formatCurrency(metrics.totalBalance) : "—"}
          icon={DollarSign}
          trend={
            metrics?.totalBalance
              ? metrics.totalBalance > 0
                ? "up"
                : "down"
              : "neutral"
          }
          trendLabel="Overall ledger balance"
          accentColor="brand"
          loading={metricsLoading}
        />
        <MetricCard
          title="Total Customers"
          value={metrics ? String(metrics.totalCustomers) : "—"}
          icon={Users}
          trend="neutral"
          trendLabel="Active customers"
          accentColor="brand"
          loading={metricsLoading}
        />
        <MetricCard
          title="Monthly Net"
          value={metrics ? formatCurrency(metrics.monthlyNet) : "—"}
          icon={Activity}
          trend={
            metrics?.monthlyNet
              ? metrics.monthlyNet > 0
                ? "up"
                : "down"
              : "neutral"
          }
          trendLabel="This month's net flow"
          accentColor="positive"
          loading={metricsLoading}
        />
      </div>

      {/* ─── Charts Row ─── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Area Chart */}
        <Card className="xl:col-span-2 border-border/60 bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-0 pt-4 px-5">
            <div>
              <CardTitle className="text-sm font-semibold text-foreground">
                Transaction Flow
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Recent activity trend
              </p>
            </div>
            <Badge
              variant="outline"
              className="text-primary border-primary/30 bg-primary/5 text-[10px] font-semibold"
            >
              Last 5 entries
            </Badge>
          </CardHeader>
          <CardContent className="pt-4 px-2 pb-4">
            {txnsLoading ? (
              <Skeleton className="h-52 w-full" />
            ) : chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart
                  data={chartData}
                  margin={{ top: 10, right: 16, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient
                      id="colorFlowPos"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#EA580C" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#EA580C" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.04)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                    axisLine={false}
                    tickLine={false}
                    width={50}
                    tickFormatter={(v) =>
                      v >= 1000 ? `₹${(v / 1000).toFixed(0)}k` : `₹${v}`
                    }
                  />
                  <RechartsTooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="amount"
                    stroke="#EA580C"
                    strokeWidth={2}
                    fill="url(#colorFlowPos)"
                    dot={{
                      fill: "#EA580C",
                      r: 4,
                      strokeWidth: 2,
                      stroke: "var(--card)",
                    }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-52 flex flex-col items-center justify-center gap-2 text-muted-foreground">
                <Activity className="w-8 h-8 opacity-30" />
                <p className="text-sm">No transaction data yet</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bar chart by type */}
        <Card className="border-border/60 bg-card">
          <CardHeader className="pb-0 pt-4 px-5">
            <CardTitle className="text-sm font-semibold text-foreground">
              By Type
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Credit vs Debit breakdown
            </p>
          </CardHeader>
          <CardContent className="pt-4 px-2 pb-4">
            {txnsLoading ? (
              <Skeleton className="h-52 w-full" />
            ) : chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart
                  data={chartData}
                  margin={{ top: 10, right: 8, left: 0, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.04)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                    axisLine={false}
                    tickLine={false}
                    width={40}
                    tickFormatter={(v) => `₹${Math.abs(v) >= 1000 ? (Math.abs(v) / 1000).toFixed(0) + "k" : Math.abs(v)}`}
                  />
                  <RechartsTooltip content={<CustomTooltip />} />
                  <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell
                        key={index}
                        fill={entry.type === "credit" ? "#34D399" : "#E11D48"}
                        fillOpacity={0.85}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-52 flex flex-col items-center justify-center gap-2 text-muted-foreground">
                <TrendingUp className="w-8 h-8 opacity-30" />
                <p className="text-sm">No data</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ─── Analytics: trend, debtors, aging ─── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* 12-month trend */}
        <Card className="xl:col-span-2 border-border/60 bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-0 pt-4 px-5">
            <div>
              <CardTitle className="text-sm font-semibold text-foreground">
                12-Month Trend
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Credit given vs payments received
              </p>
            </div>
            <div className="flex items-center gap-3 text-[10px] font-semibold text-muted-foreground">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#34D399]" />
                Credit
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#E11D48]" />
                Paid
              </span>
            </div>
          </CardHeader>
          <CardContent className="pt-4 px-2 pb-4">
            {analyticsLoading ? (
              <Skeleton className="h-56 w-full" />
            ) : analytics && analytics.trend.some((t) => t.credit || t.debit) ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart
                  data={analytics.trend}
                  margin={{ top: 10, right: 16, left: 0, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.04)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="month"
                    tickFormatter={monthLabel}
                    tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                    axisLine={false}
                    tickLine={false}
                    width={46}
                    tickFormatter={(v) =>
                      Math.abs(v) >= 1000
                        ? `₹${(Math.abs(v) / 1000).toFixed(0)}k`
                        : `₹${Math.abs(v)}`
                    }
                  />
                  <RechartsTooltip content={<TrendTooltip />} />
                  <Bar
                    dataKey="credit"
                    name="Credit"
                    fill="#34D399"
                    fillOpacity={0.85}
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="debit"
                    name="Paid"
                    fill="#E11D48"
                    fillOpacity={0.85}
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-56 flex flex-col items-center justify-center gap-2 text-muted-foreground">
                <TrendingUp className="w-8 h-8 opacity-30" />
                <p className="text-sm">No activity in the last 12 months</p>
                <p className="text-xs">Record a credit to start the trend.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top debtors + aging */}
        <div className="flex flex-col gap-4">
          <Card className="border-border/60 bg-card">
            <CardHeader className="pb-2 pt-4 px-5">
              <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                <HandCoins className="w-4 h-4 text-primary" />
                Top Debtors
              </CardTitle>
            </CardHeader>
            <CardContent className="px-0 pb-2">
              {analyticsLoading ? (
                <div className="space-y-2 px-5">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : analytics && analytics.topDebtors.length > 0 ? (
                <div className="divide-y divide-border/40">
                  {analytics.topDebtors.map((debtor) => (
                    <Link
                      key={debtor.customerId}
                      href={`/customers/detail?id=${debtor.customerId}`}
                      className="flex items-center gap-3 px-5 py-2.5 hover:bg-muted/20 transition-colors"
                    >
                      <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                        {debtor.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-foreground truncate">
                          {debtor.name}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {debtor.ageDays === null
                            ? "No unpaid credit"
                            : debtor.ageDays === 0
                              ? "Unpaid today"
                              : `Unpaid ${debtor.ageDays}d`}
                        </p>
                      </div>
                      <span className="text-xs font-bold text-foreground font-mono tabular-nums shrink-0">
                        {formatCurrency(debtor.outstanding)}
                      </span>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 px-5 text-center text-muted-foreground">
                  <CheckCircle2 className="w-6 h-6 opacity-30 mb-1.5" />
                  <p className="text-xs">No outstanding balances</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-card">
            <CardHeader className="pb-2 pt-4 px-5">
              <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                Receivables Aging
              </CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-4">
              {analyticsLoading ? (
                <Skeleton className="h-16 w-full" />
              ) : (
                <div className="space-y-2.5">
                  {(() => {
                    const buckets = analytics?.aging ?? { "0-30": 0, "31-60": 0, "60+": 0 };
                    const total = buckets["0-30"] + buckets["31-60"] + buckets["60+"] || 1;
                    const segs = [
                      { key: "0-30", value: buckets["0-30"], fill: "bg-[#34D399]" },
                      { key: "31-60", value: buckets["31-60"], fill: "bg-[#FB923C]" },
                      { key: "60+", value: buckets["60+"], fill: "bg-[#E11D48]" },
                    ] as const;
                    return (
                      <div
                        className="flex h-2 w-full overflow-hidden rounded-full bg-muted"
                        role="img"
                        aria-label={`Aging split: 0-30 ${formatCurrency(buckets["0-30"])}, 31-60 ${formatCurrency(buckets["31-60"])}, 60+ ${formatCurrency(buckets["60+"])}`}
                      >
                        {segs.map(({ key, value, fill }) => (
                          <div
                            key={key}
                            className={fill}
                            style={{ width: `${(value / total) * 100}%` }}
                          />
                        ))}
                      </div>
                    );
                  })()}
                  <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      { key: "0-30", tone: "text-[#34D399]", bg: "bg-[#34D399]/10" },
                      { key: "31-60", tone: "text-[#FB923C]", bg: "bg-[#FB923C]/10" },
                      { key: "60+", tone: "text-[#E11D48]", bg: "bg-[#E11D48]/10" },
                    ] as const
                  ).map(({ key, tone, bg }) => (
                    <div
                      key={key}
                      className={cn("rounded-lg border border-border/40 p-2.5", bg)}
                    >
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        {key} days
                      </p>
                      <p className={cn("text-sm font-bold font-mono tabular-nums mt-0.5", tone)}>
                        {formatCurrency(analytics?.aging[key] ?? 0)}
                      </p>
                    </div>
                  ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ─── Recent Transactions ─── */}
      <Card className="border-border/60 bg-card">
        <CardHeader className="flex flex-row items-center justify-between pb-3 pt-4 px-5">
          <div>
            <CardTitle className="text-sm font-semibold text-foreground">
              Recent Transactions
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Latest activity across all customers
            </p>
          </div>
          <Link href="/customers">
            <Button
              variant="ghost"
              size="sm"
              className="text-primary hover:text-primary/80 gap-1 text-xs h-7"
            >
              View all
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          {txnsLoading ? (
            <div className="divide-y divide-border/40">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 px-5 py-3.5"
                >
                  <Skeleton className="w-8 h-8 rounded-lg shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3.5 w-24" />
                    <Skeleton className="h-2.5 w-32" />
                  </div>
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          ) : recentTxns && recentTxns.length > 0 ? (
            <div className="divide-y divide-border/40">
              {recentTxns.map((tx) => {
                const customer = customers?.find((c) => c.id === tx.customerId);
                const isCredit = tx.type === "credit";
                const methodLabel = paymentMethodLabel(tx.paymentMethod);
                return (
                  <Link
                    key={tx.id}
                    href={`/customers/detail?id=${tx.customerId}`}
                    className="flex items-center gap-4 px-5 py-3.5 hover:bg-muted/20 transition-colors group"
                  >
                    <div
                      className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                        isCredit
                          ? "bg-[#34D399]/12 text-[#34D399]"
                          : methodLabel
                            ? "bg-[#FB923C]/12 text-[#FB923C]"
                            : "bg-[#E11D48]/12 text-[#E11D48]"
                      )}
                    >
                      {isCredit ? (
                        <TrendingUp className="w-4 h-4" />
                      ) : (
                        <TrendingDown className="w-4 h-4" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                        {customer?.name || "Unknown Customer"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {tx.note || tx.type}
                        {methodLabel ? ` · ${methodLabel}` : ""} ·{" "}
                        {format(new Date(tx.createdAt), "MMM d, yyyy")}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={cn(
                          "text-sm font-bold font-mono tabular-nums",
                          isCredit
                            ? "text-[#34D399]"
                            : methodLabel
                              ? "text-[#FB923C]"
                              : "text-[#E11D48]"
                        )}
                      >
                        {isCredit ? "+" : "−"}
                        {formatCurrency(tx.amount)}
                      </span>
                      <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground/40 group-hover:text-primary/60 transition-colors" />
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground">
              <Activity className="w-8 h-8 opacity-30" />
              <p className="text-sm">No recent transactions</p>
              <Link href="/customers">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs h-7 gap-1.5 border-border/50"
                >
                  <Plus className="w-3 h-3" />
                  Add your first customer
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      <OnboardingFlow />
    </div>
  );
}
