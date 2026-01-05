import React, { useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/hooks/useAuth";
import { getDashboardMetrics, getRecentTransactions } from "@/lib/dashboard";
import { MetricCard } from "@/components/MetricCard";
import { QuickEntryModal } from "@/components/QuickEntryModal";
import {
  DashboardMetrics,
  RecentTransaction,
  formatCurrency,
  formatRelativeTime,
} from "@/types/database";

export default function DashboardScreen() {
  const { session, loading: authLoading } = useAuth();

  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<
    RecentTransaction[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [quickEntryType, setQuickEntryType] = useState<
    "credit" | "debit" | null
  >(null);

  const fetchDashboardData = async () => {
    if (!session?.user) return;

    try {
      const [metricsData, transactionsData] = await Promise.all([
        getDashboardMetrics(session.user.id),
        getRecentTransactions(session.user.id, 5),
      ]);
      setMetrics(metricsData);
      setRecentTransactions(transactionsData);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (authLoading) return;
      fetchDashboardData();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [session, authLoading]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  const handleQuickEntry = (type: "credit" | "debit") => {
    setQuickEntryType(type);
  };

  const handleQuickEntryClose = () => {
    setQuickEntryType(null);
    fetchDashboardData();
  };

  if (authLoading || loading) {
    return (
      <View className="flex-1 items-center justify-center bg-[#1a1a1a]">
        <ActivityIndicator size="large" color="#ffffff" />
      </View>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <View className="flex-1 bg-[#1a1a1a]">
      <View className="px-6 pt-[60px] pb-6">
        <Text className="text-3xl font-extrabold text-white">Dashboard</Text>
        <Text className="text-base text-[#888888] mt-1">
          Welcome back to LedgerX
        </Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#fff"
          />
        }
      >
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
            value={formatCurrency(metrics?.thisMonthNet || 0)}
            icon="trending-up"
            iconColor={
              metrics?.thisMonthNet && metrics.thisMonthNet >= 0
                ? "#10B981"
                : "#EF4444"
            }
            trend={{
              value: "vs last month",
              isPositive:
                metrics?.thisMonthNet !== undefined &&
                metrics.thisMonthNet >= 0,
            }}
          />
          <MetricCard
            title="Pending Due"
            value={formatCurrency(metrics?.pendingDue || 0)}
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
              className="flex-1 flex-row items-center justify-center bg-[#2a2a2a] rounded-xl py-4 gap-2 border border-[#333]"
              onPress={() => handleQuickEntry("credit")}
            >
              <Ionicons name="add-circle" size={24} color="#10B981" />
              <Text className="text-white text-base font-semibold">
                + Credit
              </Text>
            </Pressable>
            <Pressable
              className="flex-1 flex-row items-center justify-center bg-[#2a2a2a] rounded-xl py-4 gap-2 border border-[#333]"
              onPress={() => handleQuickEntry("debit")}
            >
              <Ionicons name="remove-circle" size={24} color="#EF4444" />
              <Text className="text-white text-base font-semibold">
                + Debit
              </Text>
            </Pressable>
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
              {recentTransactions.map((transaction) => (
                <View
                  key={transaction.id}
                  className="flex-row items-center justify-between bg-[#2a2a2a] rounded-xl p-4"
                >
                  <View className="flex-row items-center flex-1 mr-3">
                    <View
                      className="w-9 h-9 rounded-lg items-center justify-center mr-3"
                      style={{
                        backgroundColor:
                          transaction.type === "credit"
                            ? "rgba(16, 185, 129, 0.1)"
                            : "rgba(239, 68, 68, 0.1)",
                      }}
                    >
                      <Ionicons
                        name={
                          transaction.type === "credit"
                            ? "arrow-down"
                            : "arrow-up"
                        }
                        size={16}
                        color={
                          transaction.type === "credit" ? "#10B981" : "#EF4444"
                        }
                      />
                    </View>
                    <View className="flex-1">
                      <Text className="text-white font-medium text-base">
                        {transaction.contactName}
                      </Text>
                      <Text className="text-[#888888] text-sm mt-0.5">
                        {transaction.note ||
                          formatRelativeTime(transaction.created_at)}
                      </Text>
                    </View>
                  </View>
                  <View className="items-end">
                    <Text
                      className="text-base font-semibold"
                      style={{
                        color:
                          transaction.type === "credit" ? "#10B981" : "#EF4444",
                      }}
                    >
                      {transaction.type === "credit" ? "+" : "-"}
                      {formatCurrency(transaction.amount)}
                    </Text>
                    <Text className="text-[#666666] text-xs mt-0.5">
                      {formatRelativeTime(transaction.created_at)}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      <QuickEntryModal
        visible={quickEntryType !== null}
        onClose={handleQuickEntryClose}
        type={quickEntryType || "credit"}
      />
    </View>
  );
}
