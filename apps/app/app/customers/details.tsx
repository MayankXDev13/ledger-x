import { useCallback, useMemo, useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  Pressable,
  ActivityIndicator,
  Linking,
  RefreshControl,
  Alert,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, router, Link, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
  customersApi,
  transactionsApi,
  type Customer,
  type PaymentMethod,
  type Transaction,
} from "@/lib/api";
import { format } from "date-fns";
import { EditTransactionModal } from "@/components/EditTransactionModal";
import { DeleteConfirmationDialog } from "@/components/DeleteConfirmationDialog";
import { isPaymentEntry, paymentMethodLabel } from "@/lib/payments";
import { formatCurrency } from "@/types/database";
import { colors } from "@/lib/theme";
import { useOfflineQueue } from "@/hooks/useOfflineQueue";
import { entriesNotIn } from "@/lib/queue-core";
import { ErrorState } from "@/components/ErrorState";

interface BalanceData {
  totalCredit: number;
  totalDebit: number;
  balance: number;
}

export default function CustomerDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [entries, setEntries] = useState<Transaction[]>([]);
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

  const fetchData = useCallback(async () => {
    if (!id) return;

    try {
      const [customerData, paged] = await Promise.all([
        customersApi.get(id),
        transactionsApi.listByCustomer(id, { pageSize: 100 }),
      ]);

      setCustomer(customerData);
      setEntries(paged.data);
      setBalance({
        totalCredit: paged.totalCredit,
        totalDebit: paged.totalDebit,
        balance: paged.totalCredit - paged.totalDebit,
      });
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load this customer");
    } finally {
      setLoading(false);
    }
  }, [id]);

  // The screen reloads when it regains focus, so an entry recorded a moment
  // earlier is listed without the user pulling to refresh. The first load
  // still shows the spinner because `loading` starts true.
  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
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
    // A positive balance means the customer still owes the shopkeeper.
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

  /**
   * Entries recorded offline are queued locally, so they are merged into the
   * list here instead of waiting for the server. A queued entry stays in the
   * list until the server list holds it under the same id, so an entry that
   * was just synced does not blink out before the list is refetched.
   */
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
      paymentMethod: (entry.paymentMethod as PaymentMethod | null) ?? null,
      note: entry.note ?? undefined,
      createdAt: entry.createdAt,
    }));
    return [...queued, ...entries].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }, [entries, queuedEntries, id]);

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={colors.ink} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.loader}>
        <ErrorState
          title="Could not load this customer"
          message={error}
          onRetry={fetchData}
        />
      </View>
    );
  }

  if (!customer) {
    return (
      <View style={styles.loader}>
        <ErrorState
          title="Customer not found"
          message="This customer may have been deleted."
        />
      </View>
    );
  }


  const renderEntry = ({ item }: { item: Transaction }) => {
    const isCredit = item.type === "credit";
    const isPayment = isPaymentEntry(item);
    const method = paymentMethodLabel(item.paymentMethod);

    return (
      <Pressable
        style={[
          styles.entryCard,
          isPayment && { backgroundColor: "rgba(52, 211, 153, 0.05)" },
        ]}
        onPress={() => setEditingTransaction(item)}
        accessibilityRole="button"
        accessibilityLabel={`${isPayment ? "Payment received" : isCredit ? "Credit given" : "Debit"} of ${formatCurrency(Number(item.amount))}${item.note ? `, ${item.note}` : ""}`}
      >
        <View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Text
              style={[
                styles.entryAmount,
                isPayment
                  ? styles.payment
                  : isCredit
                    ? styles.credit
                    : styles.debit,
              ]}
            >
              {formatAmount(Number(item.amount), item.type)}
            </Text>
            {isPayment && method && (
              <View style={styles.methodBadge}>
                <Text style={styles.methodText}>{method}</Text>
              </View>
            )}
          </View>
          <Text style={styles.entryDate}>
            {format(new Date(item.createdAt), "dd MMM yyyy, hh:mm a")}
          </Text>
          {typeof item.runningBalance !== "undefined" && (
            <Text
              style={[
                styles.entryBalance,
                item.runningBalance > 0
                  ? styles.owe
                  : item.runningBalance < 0
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

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
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

        {/* BALANCE */}
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

      {/* ACTIONS */}
      <View style={styles.actions}>
        <Pressable
          style={styles.actionBtn}
          onPress={() => router.push(`/ledger/add?contactId=${id}&type=credit`)}
          accessibilityRole="button"
          accessibilityLabel="Record a credit"
        >
          <Ionicons name="add-circle" size={18} color={colors.brand} />
          <Text style={styles.credit}>Credit</Text>
        </Pressable>

        <Pressable
          style={styles.actionBtn}
          onPress={() => router.push(`/ledger/add?contactId=${id}&type=debit`)}
          accessibilityRole="button"
          accessibilityLabel="Record a payment received"
        >
          <Ionicons name="remove-circle" size={18} color={colors.positive} />
          <Text style={styles.debit}>Payment</Text>
        </Pressable>

        <Link
          href={`/customers/statement?id=${id}`}
          style={styles.actionBtn}
          asChild
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`View ${customer.name}'s statement`}
          >
            <Ionicons name="document-text" size={18} color={colors.brand} />
            <Text style={styles.smsText}>Statement</Text>
          </Pressable>
        </Link>

        <Pressable
          style={styles.whatsappBtn}
          onPress={sendWhatsApp}
          accessibilityRole="button"
          accessibilityLabel={`Send ${customer.name} a WhatsApp balance update`}
        >
          <Ionicons name="logo-whatsapp" size={18} color={colors.brand} />
          <Text style={styles.whatsappText}>WhatsApp</Text>
        </Pressable>

        <Pressable
          style={styles.smsBtn}
          onPress={sendSMS}
          accessibilityRole="button"
          accessibilityLabel={`Send ${customer.name} an SMS balance update`}
        >
          <Ionicons name="chatbubble" size={18} color={colors.brand} />
          <Text style={styles.smsText}>SMS</Text>
        </Pressable>
      </View>

      {/* TRANSACTIONS */}
      <View style={styles.txHeader}>
        <Text style={styles.txTitle}>Transactions</Text>
      </View>

      <FlatList
        data={visibleEntries}
        renderItem={renderEntry}
        keyExtractor={(i) => i.id}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: insets.bottom + 24 },
        ]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
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

      {/* MODALS */}
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
          await fetchData();
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
            await fetchData();
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
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },

  header: {
    paddingTop: Platform.OS === "android" ? 48 : 60,
    paddingHorizontal: 20,
  },

  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  name: { fontSize: 26, fontWeight: "700", color: "#fff", flexShrink: 1 },
  phone: { color: colors.inkMuted, marginTop: 4 },

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
    padding: 10,
    borderRadius: 12,
    minHeight: 44,
    justifyContent: "center",
  },

  editText: { color: colors.brand, fontWeight: "600" },

  balanceCard: {
    backgroundColor: colors.surfaceRaised,
    borderRadius: 16,
    padding: 18,
    marginTop: 16,
    alignItems: "center",
  },

  balanceLabel: { color: colors.inkMuted },
  balanceAmount: { fontSize: 32, fontWeight: "700", fontVariant: ["tabular-nums"] },

  owe: { color: colors.ink },
  owed: { color: colors.ink },
  settled: { color: colors.inkMuted },

  balanceMeta: {
    flexDirection: "row",
    gap: 16,
    marginTop: 8,
  },

  meta: { color: colors.inkMuted, fontSize: 13, fontVariant: ["tabular-nums"] },

  actions: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 20,
    marginVertical: 16,
  },

  actionBtn: {
    flex: 1,
    height: 46,
    backgroundColor: colors.surface,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },

  whatsappBtn: {
    flex: 1,
    height: 46,
    backgroundColor: colors.surfaceRaised,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    borderWidth: 1,
    borderColor: colors.line,
  },

  whatsappText: { color: colors.brand, fontWeight: "600" },

  smsBtn: {
    flex: 1,
    height: 46,
    backgroundColor: colors.surface,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },

  smsText: { color: colors.brand, fontWeight: "600" },

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
    paddingHorizontal: 20,
    marginTop: 8,
  },

  txTitle: { color: "#fff", fontSize: 18, fontWeight: "600" },

  list: { paddingHorizontal: 20, paddingBottom: 24 },

  entryCard: {
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#222",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  entryAmount: { fontSize: 18, fontWeight: "600", fontVariant: ["tabular-nums"] },
  entryDate: { color: colors.inkMuted, marginTop: 2 },
  entryBalance: { color: colors.inkMuted, marginTop: 4, fontSize: 13, fontVariant: ["tabular-nums"] },
  entryNote: { color: colors.inkMuted, fontStyle: "italic", marginTop: 4 },

  emptyText: {
    color: colors.inkMuted,
    textAlign: "center",
    marginTop: 12,
    fontSize: 15,
  },
  emptyHint: { color: colors.inkMuted, textAlign: "center", marginTop: 4, fontSize: 13 },
});
