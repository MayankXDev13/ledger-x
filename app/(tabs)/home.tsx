import React, { useState, useCallback, useRef } from "react";
import {
  StyleSheet,
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
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ffffff" />
      </View>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Dashboard</Text>
        <Text style={styles.subtitle}>Welcome back to LedgerX</Text>
      </View>

      <ScrollView
        style={styles.scrollContent}
        contentContainerStyle={styles.scrollContentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#fff"
          />
        }
      >
        <View style={styles.metricsGrid}>
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

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionButtons}>
            <Pressable
              style={styles.actionButton}
              onPress={() => handleQuickEntry("credit")}
            >
              <Ionicons name="add-circle" size={24} color="#10B981" />
              <Text style={styles.actionButtonText}>+ Credit</Text>
            </Pressable>
            <Pressable
              style={styles.actionButton}
              onPress={() => handleQuickEntry("debit")}
            >
              <Ionicons name="remove-circle" size={24} color="#EF4444" />
              <Text style={styles.actionButtonText}>+ Debit</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          {recentTransactions.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="receipt-outline" size={48} color="#444" />
              <Text style={styles.emptyStateText}>No transactions yet</Text>
              <Text style={styles.emptyStateSubtext}>
                Add your first transaction to see it here
              </Text>
            </View>
          ) : (
            <View style={styles.transactionsList}>
              {recentTransactions.map((transaction) => (
                <View key={transaction.id} style={styles.transactionItem}>
                  <View style={styles.transactionLeft}>
                    <View
                      style={[
                        styles.transactionIcon,
                        {
                          backgroundColor:
                            transaction.type === "credit"
                              ? "rgba(16, 185, 129, 0.1)"
                              : "rgba(239, 68, 68, 0.1)",
                        },
                      ]}
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
                    <View style={styles.transactionInfo}>
                      <Text style={styles.transactionName}>
                        {transaction.contactName}
                      </Text>
                      <Text style={styles.transactionNote}>
                        {transaction.note ||
                          formatRelativeTime(transaction.created_at)}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.transactionRight}>
                    <Text
                      style={[
                        styles.transactionAmount,
                        {
                          color:
                            transaction.type === "credit"
                              ? "#10B981"
                              : "#EF4444",
                        },
                      ]}
                    >
                      {transaction.type === "credit" ? "+" : "-"}
                      {formatCurrency(transaction.amount)}
                    </Text>
                    <Text style={styles.transactionTime}>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a1a",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1a1a1a",
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 24,
  },
  greeting: {
    fontSize: 28,
    fontWeight: "800",
    color: "#ffffff",
  },
  subtitle: {
    fontSize: 16,
    color: "#888888",
    marginTop: 4,
  },
  scrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingHorizontal: 24,
    paddingBottom: 100,
  },
  metricsGrid: {
    gap: 12,
  },
  section: {
    marginTop: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#ffffff",
    marginBottom: 16,
  },
  actionButtons: {
    flexDirection: "row",
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2a2a2a",
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: "#333",
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 48,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#888888",
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: "#666666",
    marginTop: 4,
  },
  transactionsList: {
    gap: 12,
  },
  transactionItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#2a2a2a",
    borderRadius: 12,
    padding: 16,
  },
  transactionLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 12,
  },
  transactionIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#ffffff",
  },
  transactionNote: {
    fontSize: 13,
    color: "#888888",
    marginTop: 2,
  },
  transactionRight: {
    alignItems: "flex-end",
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: "600",
  },
  transactionTime: {
    fontSize: 12,
    color: "#666666",
    marginTop: 2,
  },
});
