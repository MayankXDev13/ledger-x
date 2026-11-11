import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Linking,
  Alert,
  Platform,
} from "react-native";
import { useLocalSearchParams, useRouter, useFocusEffect, Link } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { customersApi, transactionsApi } from "@/lib/api";
import type { Customer, Transaction } from "@/lib/api";
import { EditTransactionModal } from "@/components/EditTransactionModal";
import { DeleteConfirmationDialog } from "@/components/DeleteConfirmationDialog";
import { colors } from "@/lib/theme";
import { formatCurrency } from "@/types/database";
import { useOfflineQueue } from "@/hooks/useOfflineQueue";
import { entriesNotIn } from "@/lib/queue-core";
import { ErrorState } from "@/components/ErrorState";

interface BalanceData {
  totalCredit: number;
  totalDebit: number;
  balance: number;
}

const PAGE_SIZE = 10;

export default function CustomerDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [entries, setEntries] = useState<Transaction[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [typeFilter, setTypeFilter] = useState<"all" | "credit" | "debit">("all");

  const { queuedEntries } = useOfflineQueue();
  const [balance, setBalance] = useState<BalanceData>({
    totalCredit: 0,
    totalDebit: 0,
    balance: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const [editingTransaction, setEditingTransaction] =
    useState<Transaction | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteEntryId, setDeleteEntryId] = useState<string | null>(null);

  /* -------------------- DATA -------------------- */

  const fetchData = useCallback(
    async (pageToFetch = 1, isRefresh = false) => {
      if (!id) return;
      if (pageToFetch > 1) {
        setLoadingMore(true);
      }

      try {
        const [customerData, paged] = await Promise.all([
          pageToFetch === 1 ? customersApi.get(id) : Promise.resolve(customer),
          transactionsApi.listByCustomer(id, { page: pageToFetch, pageSize: PAGE_SIZE }),
        ]);

        if (customerData) {
          setCustomer(customerData);
        }

        if (pageToFetch === 1 || isRefresh) {
          setEntries(paged.data);
        } else {
          setEntries((prev) => {
            const existingIds = new Set(prev.map((e) => e.id));
            const newEntries = paged.data.filter((e) => !existingIds.has(e.id));
            return [...prev, ...newEntries];
          });
        }

        setPage(pageToFetch);
        setHasMore(paged.data.length === PAGE_SIZE && pageToFetch * PAGE_SIZE < paged.total);
        setBalance({
          totalCredit: paged.totalCredit,
          totalDebit: paged.totalDebit,
          balance: paged.totalCredit - paged.totalDebit,
        });
        setError(null);
      } catch (err) {
        if (pageToFetch === 1) {
          setError(err instanceof Error ? err.message : "Could not load this customer");
        }
      } finally {
        setLoading(false);
        setLoadingMore(false);
        setRefreshing(false);
      }
    },
    [id, customer],
  );

  useFocusEffect(
    useCallback(() => {
      fetchData(1);
    }, [fetchData]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData(1, true);
  };

  const handleLoadMore = () => {
    if (!loading && !loadingMore && hasMore) {
      fetchData(page + 1);
    }
  };

  /* -------------------- ACTIONS -------------------- */

  const formatAmount = (amount: number, type: string) => {
    const formatted = new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
    return type === "credit" ? `+${formatted}` : `-${formatted}`;
  };

  const balanceText = () => {
    if (balance.balance > 0) return `They owe ₹${balance.balance.toFixed(2)}`;
    if (balance.balance < 0)
      return `You owe ₹${Math.abs(balance.balance).toFixed(2)}`;
    return "All settled up";
  };

  const sendSMS = () => {
    if (!customer) return;
    const message = `Ledger Update - Ledger-X\n\nCustomer: ${customer.name}\nBalance: ${balanceText()}`;
    const phone = customer.phone.replace(/\D/g, "");
    Linking.openURL(`sms:${phone}?body=${encodeURIComponent(message)}`);
  };

  const sendWhatsApp = async () => {
    if (!customer) return;
    const message = `Ledger Update - Ledger-X\n\nCustomer: ${customer.name}\nBalance: ${balanceText()}`;
    const phone = customer.phone.replace(/\D/g, "");
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

    Linking.openURL(url).catch(() => {
      Alert.alert("WhatsApp not available", "Try sending SMS instead");
    });
  };

  /* -------------------- RENDER -------------------- */

  const visibleEntries = useMemo<Transaction[]>(() => {
    const serverIds = entries.map((entry) => entry.id);
    const queued: Transaction[] = entriesNotIn(
      queuedEntries.filter((entry) => entry.customerId === id),
      serverIds,
    ).map((entry) => ({
      id: entry.id,
      userId: "",
      customerId: entry.customerId,
      amount: entry.amount,
      type: entry.type,
      note: entry.note,
      paymentMethod: (entry.paymentMethod as Transaction["paymentMethod"]) ?? null,
      createdAt: entry.createdAt,
    }));

    return [...queued, ...entries];
  }, [entries, queuedEntries, id]);

  const filteredEntries = useMemo(() => {
    if (typeFilter === "all") return visibleEntries;
    return visibleEntries.filter((e) => e.type === typeFilter);
  }, [visibleEntries, typeFilter]);

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={colors.brand} />
      </View>
    );
  }

  if (error || !customer) {
    return (
      <View style={styles.container}>
        <ErrorState
          title="Could not load customer"
          message={error || "Customer not found."}
          onRetry={() => {
            setLoading(true);
            fetchData(1);
          }}
        />
      </View>
    );
  }

  const renderEntry = ({ item }: { item: Transaction }) => {
    const isCredit = item.type === "credit";
    const amountStyle = isCredit
      ? styles.credit
      : item.paymentMethod
        ? styles.payment
        : styles.debit;

    return (
      <Pressable
        style={styles.entryCard}
        onPress={() => setEditingTransaction(item)}
        accessibilityRole="button"
        accessibilityLabel={`${item.type} transaction of ${item.amount} rupees on ${new Date(item.createdAt).toLocaleDateString("en-IN")}`}
      >
        <View style={{ flex: 1, marginRight: 12 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Text style={[styles.entryAmount, amountStyle]}>
              {formatAmount(item.amount, item.type)}
            </Text>
            {item.paymentMethod && (
              <View style={styles.methodBadge}>
                <Text style={styles.methodText}>
                  {item.paymentMethod.toUpperCase()}
                </Text>
              </View>
            )}
          </View>
          <Text style={styles.entryDate}>
            {new Date(item.createdAt).toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
          {item.runningBalance !== undefined && (
            <Text
              style={[
                styles.entryBalance,
                Number(item.runningBalance) > 0
                  ? styles.owe
                  : Number(item.runningBalance) < 0
                    ? styles.owed
                    : styles.settled,
              ]}
            >
              {formatCurrency(Math.abs(Number(item.runningBalance || 0)))}
            </Text>
          )}
          {item.note ? <Text style={styles.entryNote}>{item.note}</Text> : null}
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.inkFaint} />
      </Pressable>
    );
  };

  const bottomPadding = Math.max(insets.bottom, 12);

  const renderHeader = () => (
    <View>
      {/* Top Header Row with Back Button */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View style={styles.headerRow}>
          <Pressable
            onPress={() => router.replace("/(tabs)/customers")}
            style={styles.backBtn}
            accessibilityRole="button"
            accessibilityLabel="Back to customers"
          >
            <Ionicons name="arrow-back" size={24} color={colors.ink} />
          </Pressable>

          <View style={{ flex: 1, marginLeft: 8 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Text style={styles.name} numberOfLines={1}>
                {customer.name}
              </Text>
              {customer.isSample && (
                <View style={styles.sampleBadge}>
                  <Text style={styles.sampleText}>SAMPLE</Text>
                </View>
              )}
            </View>
            <Text style={styles.phone}>{customer.phone}</Text>
          </View>

          <Pressable
            style={styles.editBtn}
            onPress={() => router.push(`/customers/edit?id=${id}`)}
            accessibilityRole="button"
            accessibilityLabel={`Edit ${customer.name}`}
          >
            <Ionicons name="pencil" size={16} color={colors.brand} />
            <Text style={styles.editText}>Edit</Text>
          </Pressable>
        </View>

        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Balance</Text>
          <Text
            style={[
              styles.balanceAmount,
              balance.balance > 0
                ? styles.owe
                : balance.balance < 0
                  ? styles.owed
                  : styles.settled,
            ]}
          >
            ₹{Math.abs(balance.balance).toFixed(2)}
          </Text>

          <View style={styles.balanceMeta}>
            <Text style={styles.meta}>Credit ₹{balance.totalCredit}</Text>
            <Text style={styles.meta}>Debit ₹{balance.totalDebit}</Text>
          </View>
        </View>
      </View>

      {/* Action Buttons: 2-Row Hierarchy */}
      <View style={styles.actionsSection}>
        {/* Row 1: Core Ledger Actions */}
        <View style={styles.primaryActionsRow}>
          <Pressable
            style={[styles.primaryActionBtn, styles.creditBtn]}
            onPress={() => router.push(`/ledger/add?contactId=${id}&type=credit`)}
            accessibilityRole="button"
            accessibilityLabel="Record a credit"
          >
            <Ionicons name="add-circle" size={20} color={colors.brand} />
            <Text style={styles.creditText}>+ Credit</Text>
          </Pressable>

          <Pressable
            style={[styles.primaryActionBtn, styles.paymentBtn]}
            onPress={() => router.push(`/ledger/add?contactId=${id}&type=debit`)}
            accessibilityRole="button"
            accessibilityLabel="Record a payment received"
          >
            <Ionicons name="remove-circle" size={20} color={colors.positive} />
            <Text style={styles.paymentText}>Payment</Text>
          </Pressable>
        </View>

        {/* Row 2: Communication & Utility Actions */}
        <View style={styles.utilityActionsRow}>
          <Link
            href={`/customers/statement?id=${id}`}
            style={styles.utilityActionBtn}
            asChild
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`View ${customer.name}'s statement`}
            >
              <Ionicons name="document-text-outline" size={17} color={colors.ink} />
              <Text style={styles.utilityText}>Statement</Text>
            </Pressable>
          </Link>

          <Pressable
            style={[styles.utilityActionBtn, styles.whatsappUtilityBtn]}
            onPress={sendWhatsApp}
            accessibilityRole="button"
            accessibilityLabel={`Send ${customer.name} a WhatsApp balance update`}
          >
            <Ionicons name="logo-whatsapp" size={17} color="#25D366" />
            <Text style={styles.whatsappText}>WhatsApp</Text>
          </Pressable>

          <Pressable
            style={styles.utilityActionBtn}
            onPress={sendSMS}
            accessibilityRole="button"
            accessibilityLabel={`Send ${customer.name} an SMS balance update`}
          >
            <Ionicons name="chatbubble-outline" size={17} color={colors.ink} />
            <Text style={styles.utilityText}>SMS</Text>
          </Pressable>
        </View>
      </View>

      {/* Transactions Section Header & Filter Chips */}
      <View style={styles.txHeader}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Text style={styles.txTitle}>Transactions</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{visibleEntries.length}</Text>
          </View>
        </View>

        <View style={styles.filterRow}>
          {(["all", "credit", "debit"] as const).map((mode) => {
            const active = typeFilter === mode;
            return (
              <Pressable
                key={mode}
                onPress={() => setTypeFilter(mode)}
                style={[styles.filterChip, active && styles.filterChipActive]}
                accessibilityRole="button"
                accessibilityLabel={`Filter by ${mode}`}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    active && styles.filterChipTextActive,
                  ]}
                >
                  {mode === "all" ? "All" : mode === "credit" ? "Credit" : "Payment"}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredEntries}
        renderItem={renderEntry}
        keyExtractor={(i) => i.id}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: 60 + bottomPadding + 20 },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.inkMuted}
            colors={[colors.brand]}
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.3}
        ListFooterComponent={
          loadingMore ? (
            <View style={{ paddingVertical: 18, alignItems: "center" }}>
              <ActivityIndicator size="small" color={colors.brand} />
            </View>
          ) : null
        }
        ListEmptyComponent={
          <View style={{ alignItems: "center", paddingVertical: 48 }}>
            <Ionicons name="receipt-outline" size={40} color={colors.inkFaint} />
            <Text style={styles.emptyText}>No transactions yet</Text>
            <Text style={styles.emptyHint}>
              Use Credit or Payment above to record the first entry.
            </Text>
          </View>
        }
      />

      {/* Persistent Bottom Tab Bar Navigation */}
      <View
        style={[
          styles.bottomTabBar,
          {
            paddingBottom: bottomPadding,
            height: 60 + bottomPadding,
          },
        ]}
      >
        <Pressable
          onPress={() => router.replace("/(tabs)/home")}
          style={styles.bottomTabItem}
          accessibilityRole="button"
          accessibilityLabel="Home tab"
        >
          <Ionicons name="home-outline" size={24} color={colors.inkMuted} />
          <Text style={[styles.bottomTabLabel, { color: colors.inkMuted }]}>
            Home
          </Text>
        </Pressable>

        <Pressable
          onPress={() => router.replace("/(tabs)/ledger")}
          style={styles.bottomTabItem}
          accessibilityRole="button"
          accessibilityLabel="Ledger tab"
        >
          <Ionicons name="journal-outline" size={24} color={colors.inkMuted} />
          <Text style={[styles.bottomTabLabel, { color: colors.inkMuted }]}>
            Ledger
          </Text>
        </Pressable>

        <Pressable
          onPress={() => router.replace("/(tabs)/customers")}
          style={styles.bottomTabItem}
          accessibilityRole="button"
          accessibilityLabel="Customers tab"
        >
          <Ionicons name="people" size={24} color={colors.brand} />
          <Text style={[styles.bottomTabLabel, { color: colors.brand }]}>
            Customers
          </Text>
        </Pressable>

        <Pressable
          onPress={() => router.replace("/(tabs)/profile")}
          style={styles.bottomTabItem}
          accessibilityRole="button"
          accessibilityLabel="Profile tab"
        >
          <Ionicons name="person-outline" size={24} color={colors.inkMuted} />
          <Text style={[styles.bottomTabLabel, { color: colors.inkMuted }]}>
            Profile
          </Text>
        </Pressable>
      </View>

      {/* Modals */}
      <EditTransactionModal
        visible={!!editingTransaction}
        transaction={editingTransaction}
        onClose={() => setEditingTransaction(null)}
        onSave={async (entryId, amount, type, note, paymentMethod) => {
          await transactionsApi.update(entryId, {
            amount,
            type,
            note: note || undefined,
            paymentMethod: paymentMethod ?? null,
          });
          await fetchData(1, true);
        }}
        onDelete={(txId) => {
          setDeleteEntryId(txId);
          setShowDeleteConfirm(true);
        }}
      />

      <DeleteConfirmationDialog
        visible={showDeleteConfirm}
        title="Delete Transaction?"
        message="This action cannot be undone."
        confirmText="Delete"
        onConfirm={async () => {
          if (deleteEntryId) {
            await transactionsApi.remove(deleteEntryId);
            await fetchData(1, true);
          }
          setShowDeleteConfirm(false);
        }}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.bg,
  },

  header: {
    paddingHorizontal: 20,
  },

  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.line,
  },

  name: { fontSize: 24, fontWeight: "700", color: "#fff", flexShrink: 1 },
  phone: { color: colors.inkMuted, marginTop: 2, fontSize: 13 },

  sampleBadge: {
    backgroundColor: "rgba(245, 158, 11, 0.15)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  sampleText: { color: colors.inkMuted, fontSize: 11, fontWeight: "700" },

  editBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    minHeight: 40,
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.line,
  },

  editText: { color: colors.brand, fontWeight: "600", fontSize: 13 },

  balanceCard: {
    backgroundColor: colors.surfaceRaised,
    borderRadius: 16,
    padding: 18,
    marginTop: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.line,
  },

  balanceLabel: { color: colors.inkMuted, fontSize: 12, textTransform: "uppercase", letterSpacing: 1 },
  balanceAmount: { fontSize: 32, fontWeight: "700", fontVariant: ["tabular-nums"], marginTop: 4 },

  owe: { color: colors.ink },
  owed: { color: colors.ink },
  settled: { color: colors.inkMuted },

  balanceMeta: {
    flexDirection: "row",
    gap: 16,
    marginTop: 8,
  },

  meta: { color: colors.inkMuted, fontSize: 13, fontVariant: ["tabular-nums"] },

  actionsSection: {
    paddingHorizontal: 20,
    marginVertical: 14,
  },

  primaryActionsRow: {
    flexDirection: "row",
    gap: 12,
  },

  primaryActionBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
  },

  creditBtn: {
    borderColor: "rgba(234, 88, 12, 0.35)",
    backgroundColor: "rgba(234, 88, 12, 0.08)",
  },

  paymentBtn: {
    borderColor: "rgba(16, 185, 129, 0.35)",
    backgroundColor: "rgba(16, 185, 129, 0.08)",
  },

  creditText: {
    color: colors.brand,
    fontSize: 15,
    fontWeight: "700",
  },

  paymentText: {
    color: colors.positive,
    fontSize: 15,
    fontWeight: "700",
  },

  utilityActionsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 10,
  },

  utilityActionBtn: {
    flex: 1,
    height: 42,
    backgroundColor: colors.surfaceRaised,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: colors.line,
  },

  whatsappUtilityBtn: {
    borderColor: "rgba(37, 211, 102, 0.3)",
    backgroundColor: "rgba(37, 211, 102, 0.08)",
  },

  whatsappText: {
    color: "#25D366",
    fontSize: 13,
    fontWeight: "600",
  },

  utilityText: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: "600",
  },

  credit: { color: colors.ink, fontWeight: "600" },
  debit: { color: colors.inkMuted, fontWeight: "600" },
  payment: { color: colors.positive, fontWeight: "600" },

  methodBadge: {
    backgroundColor: "rgba(52, 211, 153, 0.12)",
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  methodText: { color: colors.positive, fontSize: 11, fontWeight: "600" },

  txHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginTop: 8,
    marginBottom: 8,
  },

  txTitle: { color: "#fff", fontSize: 18, fontWeight: "600" },

  countBadge: {
    backgroundColor: colors.surfaceRaised,
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: colors.line,
  },
  countBadgeText: {
    color: colors.inkMuted,
    fontSize: 11,
    fontWeight: "700",
  },

  filterRow: {
    flexDirection: "row",
    gap: 6,
  },
  filterChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
  },
  filterChipActive: {
    backgroundColor: "rgba(234, 88, 12, 0.15)",
    borderColor: colors.brand,
  },
  filterChipText: {
    color: colors.inkMuted,
    fontSize: 12,
    fontWeight: "600",
  },
  filterChipTextActive: {
    color: colors.brand,
    fontWeight: "700",
  },

  list: { paddingBottom: 24 },

  entryCard: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  entryAmount: { fontSize: 18, fontWeight: "600", fontVariant: ["tabular-nums"] },
  entryDate: { color: colors.inkMuted, marginTop: 2, fontSize: 12 },
  entryBalance: { color: colors.inkMuted, marginTop: 4, fontSize: 13, fontVariant: ["tabular-nums"] },
  entryNote: { color: colors.inkMuted, fontStyle: "italic", marginTop: 4, fontSize: 12 },

  emptyText: {
    color: colors.inkMuted,
    textAlign: "center",
    marginTop: 12,
    fontSize: 15,
  },
  emptyHint: { color: colors.inkMuted, textAlign: "center", marginTop: 4, fontSize: 13 },

  bottomTabBar: {
    backgroundColor: colors.bg,
    borderTopColor: colors.line,
    borderTopWidth: 1,
    paddingTop: 8,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  bottomTabItem: {
    alignItems: "center",
    justifyContent: "center",
    minWidth: 64,
  },
  bottomTabLabel: {
    fontFamily: "Mukta_600SemiBold",
    fontSize: 11,
    marginTop: 2,
    fontWeight: "600",
  },
});
