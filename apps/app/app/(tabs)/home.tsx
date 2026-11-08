import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";
import { Link } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/hooks/useAuth";
import {
  customersApi,
  dashboardApi,
  type Analytics,
  type Customer,
  type DashboardMetrics,
  type Transaction,
} from "@/lib/api";
import { MetricCard } from "@/components/MetricCard";
import { QuickEntryModal } from "@/components/QuickEntryModal";
import { OnboardingDialog } from "@/components/OnboardingDialog";
import { OfflinePendingBar } from "@/components/OfflinePendingBar";
import { useOfflineQueue } from "@/hooks/useOfflineQueue";
import { isPaymentEntry, paymentMethodLabel } from "@/lib/payments";
import { formatCurrency, formatRelativeTime } from "@/types/database";

const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function monthLabel(month: string): string {
  const [, m] = month.split("-");
  return MONTH_LABELS[Number(m) - 1] ?? month;
}

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const { session, loading: authLoading } = useAuth();
  const {
    outstanding,
    items,
    syncing,
    isOnline,
    retry,
    discard,
  } = useOfflineQueue();

  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [customerNames, setCustomerNames] = useState<Record<string, string>>({});
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [quickEntryType, setQuickEntryType] = useState<
    "credit" | "debit" | null
  >(null);

  const fetchDashboardData = useCallback(async () => {
    try {
      const [metricsData, transactionsData, analyticsData, customersData] =
        await Promise.all([
          dashboardApi.metrics(),
          dashboardApi.recentTransactions(),
          dashboardApi.analytics(),
          customersApi.list() as Promise<Customer[]>,
        ]);
      setMetrics(metricsData);
      setRecentTransactions(transactionsData);
      setAnalytics(analyticsData);
      setCustomerNames(
        Object.fromEntries(customersData.map((c) => [c.id, c.name])),
      );
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (authLoading) return;
      fetchDashboardData();
    }, [authLoading, fetchDashboardData]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  const handleQuickEntry = (type: "credit" | "debit") => {
    setQuickEntryType(type);
  };

  if (authLoading || loading) {
    return (
      <View className="flex-1 items-center justify-center bg-brand-dark">
        <ActivityIndicator size="large" color="#ffffff" />
      </View>
    );
  }

  if (!session) {
    return null;
  }

  const totalReceivables = analytics?.totalReceivables ?? 0;
  const maxTrend = Math.max(
    1,
    ...(analytics?.trend ?? []).map((t) => Math.max(t.credit, t.debit)),
  );

  return (
    <View className="flex-1 bg-brand-dark">
      <View className="px-6 pb-4" style={{ paddingTop: insets.top + 16 }}>
        <Text className="text-3xl font-extrabold text-white">Dashboard</Text>
        <Text className="text-base text-[#888888] mt-1">
          Welcome back to Ledger-X
        </Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingBottom: insets.bottom + 24,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#fff"
          />
        }
      >
        <OfflinePendingBar
          outstanding={outstanding}
          syncing={syncing}
          isOnline={isOnline}
          items={items}
          onRetry={retry}
          onDiscard={discard}
        />

        <View className="gap-3">
          <MetricCard
            title="Total Balance"
            value={formatCurrency(metrics?.totalBalance || 0)}
            icon="wallet"
            iconColor="#3B82F6"
          />
          <MetricCard
            title="Total Customers"
            value={(metrics?.totalCustomers || 0).toString()}
            icon="people"
            iconColor="#10B981"
          />
          <MetricCard
            title="This Month"
            value={formatCurrency(metrics?.monthlyNet || 0)}
            icon="trending-up"
            iconColor={
              metrics?.monthlyNet && metrics.monthlyNet >= 0
                ? "#10B981"
                : "#EF4444"
            }
            trend={{
              value: "vs last month",
              isPositive:
                metrics?.monthlyNet !== undefined && metrics.monthlyNet >= 0,
            }}
          />
          <MetricCard
            title="To Collect"
            value={formatCurrency(totalReceivables)}
            icon="time"
            iconColor="#F59E0B"
          />
        </View>

        <View className="mt-8">
          <Text className="text-lg font-semibold text-white mb-4">
            Quick Actions
          </Text>
          <View className="flex-row gap-3">
            <Pressable
              className="flex-1 flex-row items-center justify-center bg-brand-card rounded-xl py-4 gap-2 border border-brand-border"
              onPress={() => handleQuickEntry("credit")}
            >
              <Ionicons name="add-circle" size={24} color="#10B981" />
              <Text className="text-white text-base font-semibold">
                + Credit
              </Text>
            </Pressable>
            <Pressable
              className="flex-1 flex-row items-center justify-center bg-brand-card rounded-xl py-4 gap-2 border border-brand-border"
              onPress={() => handleQuickEntry("debit")}
            >
              <Ionicons name="remove-circle" size={24} color="#EF4444" />
              <Text className="text-white text-base font-semibold">
                + Payment
              </Text>
            </Pressable>
          </View>
        </View>

        {/* 12-month trend */}
        <View className="mt-8">
          <Text className="text-lg font-semibold text-white mb-3">
            12-Month Trend
          </Text>
          <View className="bg-brand-card rounded-xl border border-brand-border p-4">
            {analytics && analytics.trend.some((t) => t.credit || t.debit) ? (
              <>
                <View className="flex-row items-end gap-1 h-28">
                  {analytics.trend.map((point) => (
                    <View
                      key={point.month}
                      className="flex-1 flex-row items-end justify-center gap-0.5"
                    >
                      <View
                        style={{
                          height: Math.max(2, (point.credit / maxTrend) * 100),
                          backgroundColor: "#10B981",
                          width: 6,
                          borderRadius: 2,
                        }}
                      />
                      <View
                        style={{
                          height: Math.max(2, (point.debit / maxTrend) * 100),
                          backgroundColor: "#EF4444",
                          width: 6,
                          borderRadius: 2,
                        }}
                      />
                    </View>
                  ))}
                </View>
                <View className="flex-row mt-2">
                  {analytics.trend.map((point, index) => (
                    <Text
                      key={point.month}
                      className="flex-1 text-[8px] text-[#666666] text-center"
                    >
                      {index % 2 === 0 ? monthLabel(point.month) : ""}
                    </Text>
                  ))}
                </View>
                <View className="flex-row gap-4 mt-3">
                  <Text className="text-[10px] text-[#10B981]">● Credit</Text>
                  <Text className="text-[10px] text-[#EF4444]">● Paid</Text>
                </View>
              </>
            ) : (
              <View className="items-center py-6">
                <Ionicons name="bar-chart-outline" size={36} color="#444" />
                <Text className="text-[#888888] text-sm mt-2">
                  No activity in the last 12 months
                </Text>
                <Text className="text-[#666666] text-xs mt-1">
                  Record a credit to start the trend.
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Top debtors */}
        <View className="mt-8">
          <Text className="text-lg font-semibold text-white mb-3">
            Top Debtors
          </Text>
          {analytics && analytics.topDebtors.length > 0 ? (
            <View className="gap-2">
              {analytics.topDebtors.slice(0, 5).map((debtor) => (
                <Link
                  key={debtor.customerId}
                  href={`/customers/details?id=${debtor.customerId}`}
                  asChild
                >
                  <Pressable className="flex-row items-center bg-brand-card rounded-xl px-4 py-3">
                    <View className="flex-1">
                      <Text className="text-white font-medium text-sm">
                        {debtor.name}
                      </Text>
                      <Text className="text-[#666666] text-xs mt-0.5">
                        {debtor.ageDays === null
                          ? "No unpaid credit"
                          : `Unpaid ${debtor.ageDays}d`}
                      </Text>
                    </View>
                    <Text className="text-white font-semibold text-sm">
                      {formatCurrency(debtor.outstanding)}
                    </Text>
                  </Pressable>
                </Link>
              ))}
            </View>
          ) : (
            <View className="bg-brand-card rounded-xl border border-brand-border items-center py-6">
              <Ionicons name="checkmark-circle-outline" size={32} color="#444" />
              <Text className="text-[#888888] text-sm mt-2">
                No outstanding balances
              </Text>
            </View>
          )}
        </View>

        {/* Aging buckets */}
        <View className="mt-8">
          <Text className="text-lg font-semibold text-white mb-3">
            Receivables Aging
          </Text>
          <View className="flex-row gap-2">
            {(
              [
                { key: "0-30", label: "0-30d", color: "#10B981" },
                { key: "31-60", label: "31-60d", color: "#F59E0B" },
                { key: "60+", label: "60+d", color: "#EF4444" },
              ] as const
            ).map((bucket) => (
              <View
                key={bucket.key}
                className="flex-1 bg-brand-card rounded-xl border border-brand-border p-3"
              >
                <Text className="text-[10px] text-[#888888] font-semibold">
                  {bucket.label}
                </Text>
                <Text
                  className="text-sm font-bold mt-1"
                  style={{ color: bucket.color }}
                >
                  {formatCurrency(analytics?.aging[bucket.key] ?? 0)}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View className="mt-8">
          <Text className="text-lg font-semibold text-white mb-4">
            Recent Activity
          </Text>
          {recentTransactions.length === 0 ? (
            <View className="items-center py-12">
              <Ionicons name="receipt-outline" size={48} color="#444" />
              <Text className="text-[#888888] text-base font-medium mt-4">
                No transactions yet
              </Text>
              <Text className="text-[#666666] text-sm mt-1">
                Add your first transaction to see it here
              </Text>
            </View>
          ) : (
            <View className="gap-3">
              {recentTransactions.map((transaction) => {
                const isCredit = transaction.type === "credit";
                const method = paymentMethodLabel(transaction.paymentMethod);
                const isPayment = isPaymentEntry(transaction);
                return (
                  <View
                    key={transaction.id}
                    className="flex-row items-center justify-between bg-brand-card rounded-xl p-4"
                  >
                    <View className="flex-row items-center flex-1 mr-3">
                      <View
                        className="w-9 h-9 rounded-lg items-center justify-center mr-3"
                        style={{
                          backgroundColor: isPayment
                            ? "rgba(245, 158, 11, 0.1)"
                            : isCredit
                              ? "rgba(16, 185, 129, 0.1)"
                              : "rgba(239, 68, 68, 0.1)",
                        }}
                      >
                        <Ionicons
                          name={
                            isPayment
                              ? "wallet"
                              : isCredit
                                ? "arrow-down"
                                : "arrow-up"
                          }
                          size={16}
                          color={isPayment ? "#F59E0B" : isCredit ? "#10B981" : "#EF4444"}
                        />
                      </View>
                      <View className="flex-1">
                        <Text className="text-white font-medium text-base">
                          {customerNames[transaction.customerId] ??
                            "Unknown Customer"}
                        </Text>
                        <Text className="text-[#888888] text-sm mt-0.5" numberOfLines={1}>
                          {transaction.note || (isCredit ? "Credit" : "Payment")}
                          {method ? ` · ${method}` : ""} ·{" "}
                          {formatRelativeTime(transaction.createdAt)}
                        </Text>
                      </View>
                    </View>
                    <View className="items-end">
                      <Text
                        className="text-base font-semibold"
                        style={{
                          color: isPayment
                            ? "#F59E0B"
                            : isCredit
                              ? "#10B981"
                              : "#EF4444",
                        }}
                      >
                        {isCredit ? "+" : "-"}
                        {formatCurrency(transaction.amount)}
                      </Text>
                      <Text className="text-[#666666] text-xs mt-0.5">
                        {formatRelativeTime(transaction.createdAt)}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      <QuickEntryModal
        visible={quickEntryType !== null}
        onClose={() => setQuickEntryType(null)}
        type={quickEntryType || "credit"}
        onEntryAdded={fetchDashboardData}
      />

      <OnboardingDialog />
    </View>
  );
}
