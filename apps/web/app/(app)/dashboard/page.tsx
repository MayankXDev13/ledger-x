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
  BarChart,
  Bar,
  Cell,
} from "recharts";
import { ChartContainer, type ChartConfig } from "@/components/ui/chart";
import { useAuth } from "@/hooks/useAuth";
import { deriveFirstName } from "@/lib/name";
import { OnboardingFlow } from "@/components/onboarding/OnboardingFlow";
import { QueryErrorState } from "@/components/QueryErrorState";
import { paymentMethodLabel } from "@/lib/payments";
import { formatCurrency, formatCompactCurrency } from "@/lib/format";
import { moneyPresentation, moneyTextClass } from "@/lib/money";

/** Chart series colours come from the shared chart tokens, never literals. */
const flowChartConfig = {
  amount: { label: "Net flow", color: "var(--chart-4)" },
} satisfies ChartConfig;

const typeChartConfig = {
  credit: { label: "Credit given", color: "var(--chart-2)" },
  paid: { label: "Payment received", color: "var(--chart-1)" },
} satisfies ChartConfig;

const trendChartConfig = {
  credit: { label: "Credit given", color: "var(--chart-2)" },
  debit: { label: "Payment received", color: "var(--chart-1)" },
} satisfies ChartConfig;


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
  accent,
  loading,
}: {
  title: string;
  value: string;
  icon: React.ElementType;
  trend?: "up" | "down" | "neutral";
  trendLabel?: string;
  /** Token-driven accent. No violet, no blue — orange is the only brand hue. */
  accent: { bg: string; icon: string; ring: string };
  loading?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative rounded-xl border bg-card overflow-hidden",
        accent.ring
      )}
    >
      <div className="relative p-5">
        <div className="flex items-start justify-between mb-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            {title}
          </p>
          <div
            className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center",
              accent.icon
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
            <p className="text-2xl font-bold text-foreground tabular-nums">{value}</p>
            {trendLabel && (
              <div
                className={cn(
                  "flex items-center gap-1 mt-1 text-xs font-medium",
                  trend === "up"
                    ? "text-positive"
                    : trend === "down"
                      ? "text-destructive"
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

/* ── Tooltips ── */

/** Single-series tooltip that keeps the sign of the value. */
function FlowTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value?: number; payload?: { toneLabel?: string; sign?: string } }>;
  label?: string | number;
}) {
  if (!active || !payload?.length) return null;
  const entry = payload[0];
  const value = Number(entry.value ?? 0);
  const meta = entry.payload;
  return (
    <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-xl text-xs">
      <p className="text-muted-foreground mb-1">{label}</p>
      <p className="font-bold text-foreground tabular-nums">
        {meta?.sign ?? (value < 0 ? "−" : "+")}
        {formatCurrency(value)}
      </p>
      {meta?.toneLabel ? (
        <p className="text-muted-foreground mt-0.5">{meta.toneLabel}</p>
      ) : null}
    </div>
  );
}

/** Two-series tooltip that keeps the sign of every value. */
function TrendTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name?: string; value?: number; color?: string; dataKey?: string }>;
  label?: string | number;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-xl text-xs space-y-1">
      <p className="text-muted-foreground">
        {typeof label === "string" ? monthLabel(label) : label}
      </p>
      {payload.map((entry) => (
        <p
          key={entry.dataKey ?? entry.name}
          className="font-semibold flex items-center justify-between gap-4"
        >
          <span className="flex items-center gap-1.5">
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: entry.color }}
            />
            {entry.name}
          </span>
          <span className="tabular-nums">{formatCurrency(entry.value ?? 0)}</span>
        </p>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const {
    data: metrics,
    isLoading: metricsLoading,
    isError: metricsError,
    refetch: refetchMetrics,
  } = useDashboardMetrics();
  const {
    data: recentTxns,
    isLoading: txnsLoading,
    isError: txnsError,
    refetch: refetchTxns,
  } = useRecentTransactions();
  const {
    data: analytics,
    isLoading: analyticsLoading,
    isError: analyticsError,
    refetch: refetchAnalytics,
  } = useDashboardAnalytics();
  const { data: customers } = useCustomers();
  const { user } = useAuth();

  // Real first name from the Google identity, falling back to the email
  // local-part, then "there" as the greeting placeholder.
  const firstName = user ? deriveFirstName(user.name, user.email) : "there";

  const chartData = recentTxns
    ? [...recentTxns].reverse().map((tx) => {
        const money = moneyPresentation(tx);
        return {
          name: format(new Date(tx.createdAt), "MMM d"),
          amount: tx.type === "credit" ? tx.amount : -tx.amount,
          type: tx.type,
          tone: money.tone,
          sign: money.sign,
          toneLabel: money.label,
        };
      })
    : [];

  /** Totals behind the "Transaction Flow" summary sentence. */
  const flowTotals = chartData.reduce(
    (acc, row) => {
      if (row.amount >= 0) acc.credit += row.amount;
      else acc.paid += Math.abs(row.amount);
      return acc;
    },
    { credit: 0, paid: 0 }
  );

  /** Totals behind the 12-month trend summary sentence. */
  const trendTotals = (analytics?.trend ?? []).reduce(
    (acc, row) => {
      acc.credit += row.credit ?? 0;
      acc.paid += row.debit ?? 0;
      return acc;
    },
    { credit: 0, paid: 0 }
  );

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
            {getGreeting()}, <span className="capitalize">{firstName}</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Daily ledger summary and collection overview.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              refetchMetrics();
              refetchTxns();
              refetchAnalytics();
            }}
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
      {metricsError ? (
        <QueryErrorState
          title="Could not load your overview"
          message="The dashboard numbers did not load. Nothing has been changed."
          onRetry={() => refetchMetrics()}
        />
      ) : null}
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
          accent={{
            bg: "bg-primary/10",
            icon: "bg-primary/15 text-primary",
            ring: "border-primary/20",
          }}
          loading={metricsLoading}
        />
        <MetricCard
          title="Total Customers"
          value={metrics ? String(metrics.totalCustomers) : "—"}
          icon={Users}
          trend="neutral"
          trendLabel="Active customers"
          accent={{
            bg: "bg-muted",
            icon: "bg-muted text-foreground",
            ring: "border-border",
          }}
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
          accent={{
            bg: "bg-muted",
            icon: "bg-muted text-foreground",
            ring: "border-border",
          }}
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
              className="text-primary border-primary/30 bg-primary/5 text-xs font-semibold"
            >
              Last 5 entries
            </Badge>
          </CardHeader>
          <CardContent className="pt-4 px-2 pb-4">
            {txnsLoading ? (
              <Skeleton className="h-52 w-full" />
            ) : txnsError ? (
              <QueryErrorState
                title="Could not load the transaction flow"
                onRetry={() => refetchTxns()}
              />
            ) : chartData.length > 0 ? (
              <>
                <ChartContainer
                  config={flowChartConfig}
                  className="h-[200px] w-full aspect-auto"
                  role="img"
                  aria-label={`Net money flow across the last ${chartData.length} ledger entries`}
                >
                  <AreaChart
                    data={chartData}
                    margin={{ top: 10, right: 16, left: 8, bottom: 0 }}
                    accessibilityLayer
                  >
                    <defs>
                      <linearGradient
                        id="colorFlow"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop offset="5%" stopColor="var(--chart-4)" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="var(--chart-4)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="var(--border)"
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
                      width={56}
                      tickFormatter={(v) => formatCompactCurrency(v)}
                    />
                    <RechartsTooltip
                      content={<FlowTooltip />}
                      cursor={{ stroke: "var(--border)" }}
                    />
                    <Area
                      type="monotone"
                      dataKey="amount"
                      name="Net flow"
                      stroke="var(--chart-4)"
                      strokeWidth={2}
                      fill="url(#colorFlow)"
                      dot={{
                        fill: "var(--chart-4)",
                        r: 4,
                        strokeWidth: 2,
                        stroke: "var(--card)",
                      }}
                      activeDot={{ r: 6, strokeWidth: 0 }}
                    />
                  </AreaChart>
                </ChartContainer>
                <div className="flex flex-wrap items-center gap-3 px-3 pt-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: "var(--chart-4)" }}
                    />
                    Net flow — credit given above the line, payment received below
                  </span>
                </div>
                <p className="px-3 pt-1 text-xs text-muted-foreground">
                  Across the last {chartData.length} entries you gave{" "}
                  {formatCurrency(flowTotals.credit)} in credit and received{" "}
                  {formatCurrency(flowTotals.paid)} in payments.
                </p>
              </>
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
            ) : txnsError ? (
              <QueryErrorState
                title="Could not load the breakdown"
                onRetry={() => refetchTxns()}
              />
            ) : chartData.length > 0 ? (
              <>
                <ChartContainer
                  config={typeChartConfig}
                  className="h-[200px] w-full aspect-auto"
                  role="img"
                  aria-label={`Credit given versus payment received across the last ${chartData.length} ledger entries`}
                >
                  <BarChart
                    data={chartData}
                    margin={{ top: 10, right: 8, left: 8, bottom: 0 }}
                    accessibilityLayer
                  >
                    <defs>
                      <pattern
                        id="hatchTypeCredit"
                        width="6"
                        height="6"
                        patternUnits="userSpaceOnUse"
                        patternTransform="rotate(45)"
                      >
                        <rect width="6" height="6" fill="var(--chart-2)" fillOpacity={0.35} />
                        <line
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="6"
                          stroke="var(--chart-2)"
                          strokeWidth="2.5"
                        />
                      </pattern>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="var(--border)"
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
                      width={46}
                      tickFormatter={(v) => formatCompactCurrency(v)}
                    />
                    <RechartsTooltip
                      content={<FlowTooltip />}
                      cursor={{ fill: "var(--muted)", fillOpacity: 0.4 }}
                    />
                    <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell
                          key={index}
                          fill={
                            entry.tone === "paid"
                              ? "var(--chart-1)"
                              : "url(#hatchTypeCredit)"
                          }
                          fillOpacity={0.9}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ChartContainer>
                <div className="flex flex-wrap items-center gap-4 px-3 pt-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <span
                      className="w-2 h-2 rounded-sm shrink-0"
                      style={{
                        backgroundColor:
                          "repeating-linear-gradient(45deg, var(--chart-2) 0 2px, transparent 2px 4px)",
                        boxShadow: "inset 0 0 0 1px var(--chart-2)",
                      }}
                    />
                    Credit given (hatched)
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: "var(--chart-1)" }}
                    />
                    Payment received
                  </span>
                </div>
              </>
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
            <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span
                  className="w-2 h-2 rounded-sm shrink-0"
                  style={{
                    backgroundColor:
                      "repeating-linear-gradient(45deg, var(--chart-2) 0 2px, transparent 2px 4px)",
                    boxShadow: "inset 0 0 0 1px var(--chart-2)",
                  }}
                />
                Credit given (hatched)
              </span>
              <span className="flex items-center gap-1.5">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: "var(--chart-1)" }}
                />
                Payment received
              </span>
            </div>
          </CardHeader>
          <CardContent className="pt-4 px-2 pb-4">
            {analyticsLoading ? (
              <Skeleton className="h-56 w-full" />
            ) : analyticsError ? (
              <QueryErrorState
                title="Could not load the 12-month trend"
                onRetry={() => refetchAnalytics()}
              />
            ) : analytics && analytics.trend.some((t) => t.credit || t.debit) ? (
              <>
                <ChartContainer
                  config={trendChartConfig}
                  className="h-[220px] w-full aspect-auto"
                  role="img"
                  aria-label="Twelve month trend of credit given versus payments received"
                >
                  <BarChart
                    data={analytics.trend}
                    margin={{ top: 10, right: 16, left: 8, bottom: 0 }}
                    accessibilityLayer
                  >
                    <defs>
                      <pattern
                        id="hatchCredit"
                        width="6"
                        height="6"
                        patternUnits="userSpaceOnUse"
                        patternTransform="rotate(45)"
                      >
                        <rect width="6" height="6" fill="var(--chart-2)" fillOpacity={0.35} />
                        <line
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="6"
                          stroke="var(--chart-2)"
                          strokeWidth="2.5"
                        />
                      </pattern>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="var(--border)"
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
                      width={52}
                      tickFormatter={(v) => formatCompactCurrency(v)}
                    />
                    <RechartsTooltip
                      content={<TrendTooltip />}
                      cursor={{ fill: "var(--muted)", fillOpacity: 0.4 }}
                    />
                    <Bar
                      dataKey="credit"
                      name="Credit given"
                      fill="url(#hatchCredit)"
                      fillOpacity={0.9}
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="debit"
                      name="Payment received"
                      fill="var(--chart-1)"
                      fillOpacity={0.9}
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ChartContainer>
                <p className="px-3 pt-2 text-xs text-muted-foreground">
                  Over the last 12 months you gave {formatCurrency(trendTotals.credit)} in
                  credit and received {formatCurrency(trendTotals.paid)} in payments.
                </p>
                <details className="px-3 pt-2">
                  <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
                    Show the monthly figures
                  </summary>
                  <div className="mt-2 max-h-56 overflow-y-auto rounded-lg border border-border">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-border">
                          <th scope="col" className="px-3 py-2 text-left font-semibold">
                            Month
                          </th>
                          <th
                            scope="col"
                            className="px-3 py-2 text-right font-semibold"
                          >
                            Credit given
                          </th>
                          <th
                            scope="col"
                            className="px-3 py-2 text-right font-semibold"
                          >
                            Payment received
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {analytics.trend.map((row) => (
                          <tr key={row.month} className="border-b border-border/40 last:border-0">
                            <td className="px-3 py-1.5">{monthLabel(row.month)}</td>
                            <td className="px-3 py-1.5 text-right tabular-nums">
                              {formatCurrency(row.credit ?? 0)}
                            </td>
                            <td className="px-3 py-1.5 text-right tabular-nums">
                              {formatCurrency(row.debit ?? 0)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </details>
              </>
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
              ) : analyticsError ? (
                <div className="px-5 py-4">
                  <QueryErrorState
                    title="Could not load the debtors"
                    onRetry={() => refetchAnalytics()}
                  />
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
                        <p className="text-xs text-muted-foreground">
                          {debtor.ageDays === null
                            ? "No unpaid credit"
                            : debtor.ageDays === 0
                              ? "Unpaid today"
                              : `Unpaid ${debtor.ageDays}d`}
                        </p>
                      </div>
                      <span className="text-xs font-bold text-foreground tabular-nums shrink-0">
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
                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      { key: "0-30", tone: "text-foreground", bg: "bg-muted", strong: false },
                      { key: "31-60", tone: "text-destructive", bg: "bg-destructive/10", strong: false },
                      { key: "60+", tone: "text-destructive", bg: "bg-destructive/20", strong: true },
                    ] as const
                  ).map(({ key, tone, bg, strong }) => (
                    <div
                      key={key}
                      className={cn("rounded-lg border border-border/40 p-2.5", bg)}
                    >
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {key} days
                      </p>
                      <p className={cn("text-sm font-bold tabular-nums mt-0.5", tone)}>
                        {formatCurrency(analytics?.aging[key] ?? 0)}
                      </p>
                      {strong ? (
                        <p className="text-xs font-semibold text-destructive">Overdue</p>
                      ) : null}
                    </div>
                  ))}
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
          ) : txnsError ? (
            <div className="px-5 py-5">
              <QueryErrorState
                title="Could not load recent transactions"
                onRetry={() => refetchTxns()}
              />
            </div>
          ) : recentTxns && recentTxns.length > 0 ? (
            <div className="divide-y divide-border/40">
              {recentTxns.map((tx) => {
                const customer = customers?.find((c) => c.id === tx.customerId);
                const money = moneyPresentation(tx);
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
                        money.tone === "paid"
                          ? "bg-positive/12 text-positive"
                          : money.tone === "credit"
                            ? "bg-muted text-foreground"
                            : "bg-destructive/12 text-destructive"
                      )}
                    >
                      {money.tone === "credit" ? (
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
                        {tx.note || money.label}
                        {methodLabel ? ` · ${methodLabel}` : ""} ·{" "}
                        {format(new Date(tx.createdAt), "MMM d, yyyy")}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={cn(
                          "text-sm font-bold tabular-nums",
                          moneyTextClass(money.tone)
                        )}
                      >
                        {money.sign}
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
