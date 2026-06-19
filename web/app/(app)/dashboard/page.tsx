"use client";

import { useDashboardMetrics, useRecentTransactions } from "@/hooks/use-dashboard";
import { useCustomers } from "@/hooks/use-customers";
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
} from "recharts";

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}

function MetricCard({
  title,
  value,
  icon: Icon,
  trend,
  trendLabel,
  gradient,
  loading,
}: {
  title: string;
  value: string;
  icon: React.ElementType;
  trend?: "up" | "down" | "neutral";
  trendLabel?: string;
  gradient: string;
  loading?: boolean;
}) {
  return (
    <Card className="relative overflow-hidden border-border/50 bg-card/80 backdrop-blur hover:shadow-lg hover:shadow-black/20 transition-all duration-300 group">
      <div className={cn("absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity", gradient)} />
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", gradient.replace("bg-gradient-to-br", "bg-gradient-to-br"))}>
          <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center opacity-80", gradient)}>
            <Icon className="w-4 h-4 text-white" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-32" />
        ) : (
          <div className="space-y-1">
            <div className="text-2xl font-bold text-foreground">{value}</div>
            {trendLabel && (
              <div className={cn(
                "flex items-center gap-1 text-xs font-medium",
                trend === "up" ? "text-emerald-400" : trend === "down" ? "text-red-400" : "text-muted-foreground"
              )}>
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
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { data: metrics, isLoading: metricsLoading, refetch } = useDashboardMetrics();
  const { data: recentTxns, isLoading: txnsLoading } = useRecentTransactions();
  const { data: customers } = useCustomers();

  // Build simple chart data from recent transactions
  const chartData = recentTxns
    ? [...recentTxns].reverse().map((tx, i) => ({
        name: format(new Date(tx.createdAt), "MMM d"),
        amount: tx.type === "credit" ? tx.amount : -tx.amount,
        type: tx.type,
      }))
    : [];

  return (
    <div className="flex flex-col gap-6 p-6 lg:p-8 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Your financial overview at a glance
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          className="gap-2 border-border/50 hover:border-cyan-500/50 transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </Button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        <MetricCard
          title="Total Balance"
          value={metrics ? formatCurrency(metrics.totalBalance) : "—"}
          icon={DollarSign}
          trend={metrics?.totalBalance && metrics.totalBalance > 0 ? "up" : "down"}
          trendLabel="Overall ledger balance"
          gradient="from-cyan-500 to-cyan-600"
          loading={metricsLoading}
        />
        <MetricCard
          title="Total Customers"
          value={metrics ? String(metrics.totalCustomers) : "—"}
          icon={Users}
          trend="neutral"
          trendLabel="Active customers"
          gradient="from-violet-500 to-violet-600"
          loading={metricsLoading}
        />
        <MetricCard
          title="Monthly Net"
          value={metrics ? formatCurrency(metrics.monthlyNet) : "—"}
          icon={Activity}
          trend={metrics?.monthlyNet && metrics.monthlyNet > 0 ? "up" : "down"}
          trendLabel="This month's net flow"
          gradient="from-emerald-500 to-emerald-600"
          loading={metricsLoading}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Area Chart */}
        <Card className="xl:col-span-2 border-border/50 bg-card/80">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Recent Transaction Flow</CardTitle>
            <Badge variant="outline" className="text-cyan-400 border-cyan-500/30 bg-cyan-500/5">
              Last 5 transactions
            </Badge>
          </CardHeader>
          <CardContent>
            {txnsLoading ? (
              <Skeleton className="h-48 w-full" />
            ) : chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCredit" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                  <RechartsTooltip
                    contentStyle={{
                      background: "var(--card)",
                      border: "1px solid var(--border)",
                      borderRadius: "8px",
                      fontSize: 12,
                    }}
                    formatter={(value) => [formatCurrency(Math.abs(Number(value) || 0)), "Amount"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="amount"
                    stroke="#06b6d4"
                    strokeWidth={2}
                    fill="url(#colorCredit)"
                    dot={{ fill: "#06b6d4", r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
                No recent transactions
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bar chart by type */}
        <Card className="border-border/50 bg-card/80">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">By Transaction Type</CardTitle>
          </CardHeader>
          <CardContent>
            {txnsLoading ? (
              <Skeleton className="h-48 w-full" />
            ) : chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                  <RechartsTooltip
                    contentStyle={{
                      background: "var(--card)",
                      border: "1px solid var(--border)",
                      borderRadius: "8px",
                      fontSize: 12,
                    }}
                    formatter={(value) => [formatCurrency(Math.abs(Number(value) || 0)), "Amount"]}
                  />
                  <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell
                        key={index}
                        fill={entry.type === "credit" ? "#10b981" : "#ef4444"}
                        fillOpacity={0.8}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
                No data
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions Table */}
      <Card className="border-border/50 bg-card/80">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle className="text-sm font-medium">Recent Transactions</CardTitle>
          <Link href="/customers">
            <Button variant="ghost" size="sm" className="text-cyan-400 hover:text-cyan-300 gap-1">
              View all
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {txnsLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : recentTxns && recentTxns.length > 0 ? (
            <div className="space-y-1">
              {recentTxns.map((tx) => {
                const customer = customers?.find((c) => c.id === tx.customerId);
                return (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/30 transition-colors group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                        tx.type === "credit"
                          ? "bg-emerald-500/15 text-emerald-400"
                          : "bg-red-500/15 text-red-400"
                      )}>
                        {tx.type === "credit" ? (
                          <TrendingUp className="w-4 h-4" />
                        ) : (
                          <TrendingDown className="w-4 h-4" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {customer?.name || tx.customerId}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {tx.note || tx.type} · {format(new Date(tx.createdAt), "MMM d, yyyy")}
                        </p>
                      </div>
                    </div>
                    <span className={cn(
                      "text-sm font-bold tabular-nums",
                      tx.type === "credit" ? "text-emerald-400" : "text-red-400"
                    )}>
                      {tx.type === "credit" ? "+" : "-"}{formatCurrency(tx.amount)}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No recent transactions
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
