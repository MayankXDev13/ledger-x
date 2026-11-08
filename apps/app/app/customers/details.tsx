import { useEffect, useState } from "react";
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
import { useLocalSearchParams, router, Link } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
  customersApi,
  transactionsApi,
  type Customer,
  type Transaction,
} from "@/lib/api";
import { format } from "date-fns";
import { EditTransactionModal } from "@/components/EditTransactionModal";
import { DeleteConfirmationDialog } from "@/components/DeleteConfirmationDialog";
import { isPaymentEntry, paymentMethodLabel } from "@/lib/payments";
import { formatCurrency } from "@/types/database";

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
  const [balance, setBalance] = useState<BalanceData>({
    totalCredit: 0,
    totalDebit: 0,
    balance: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [editingTransaction, setEditingTransaction] =
    useState<Transaction | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteEntryId, setDeleteEntryId] = useState<string | null>(null);

  /* -------------------- DATA -------------------- */

  const fetchData = async () => {
    if (!id) return;

    setLoading(true);
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
    } catch (error) {
      console.error("Error fetching customer details:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

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
    }).format(amount);
    return type === "credit" ? `+${formatted}` : `-${formatted}`;
  };

  const balanceText = () => {
    if (balance.balance > 0) return `You owe ₹${balance.balance.toFixed(2)}`;
    if (balance.balance < 0)
      return `We owe you ₹${Math.abs(balance.balance).toFixed(2)}`;
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

  if (loading || !customer) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#fff" />
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
          isPayment && { backgroundColor: "rgba(245, 158, 11, 0.04)" },
        ]}
        onPress={() => setEditingTransaction(item)}
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
        <Ionicons name="chevron-forward" size={18} color="#666" />
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
          >
            <Ionicons name="pencil" size={16} color="#3B82F6" />
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
        >
          <Ionicons name="add-circle" size={18} color="#10B981" />
          <Text style={styles.credit}>Credit</Text>
        </Pressable>

        <Pressable
          style={styles.actionBtn}
          onPress={() => router.push(`/ledger/add?contactId=${id}&type=debit`)}
        >
          <Ionicons name="remove-circle" size={18} color="#EF4444" />
          <Text style={styles.debit}>Payment</Text>
        </Pressable>

        <Link
          href={`/customers/statement?id=${id}`}
          style={styles.actionBtn}
          asChild
        >
          <Pressable>
            <Ionicons name="document-text" size={18} color="#3B82F6" />
            <Text style={styles.smsText}>Statement</Text>
          </Pressable>
        </Link>

        <Pressable style={styles.whatsappBtn} onPress={sendWhatsApp}>
          <Ionicons name="logo-whatsapp" size={18} color="#25D366" />
          <Text style={styles.whatsappText}>WhatsApp</Text>
        </Pressable>

        <Pressable style={styles.smsBtn} onPress={sendSMS}>
          <Ionicons name="chatbubble" size={18} color="#3B82F6" />
          <Text style={styles.smsText}>SMS</Text>
        </Pressable>
      </View>

      {/* TRANSACTIONS */}
      <View style={styles.txHeader}>
        <Text style={styles.txTitle}>Transactions</Text>
      </View>

      <FlatList
        data={entries}
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
            <Ionicons name="receipt-outline" size={40} color="#444" />
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
  container: { flex: 1, backgroundColor: "#121212" },
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
  phone: { color: "#888", marginTop: 4 },

  sampleBadge: {
    backgroundColor: "rgba(245, 158, 11, 0.15)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  sampleText: { color: "#F59E0B", fontSize: 9, fontWeight: "700" },

  editBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#1F1F1F",
    padding: 10,
    borderRadius: 8,
  },

  editText: { color: "#3B82F6" },

  balanceCard: {
    backgroundColor: "#1E1E1E",
    borderRadius: 14,
    padding: 18,
    marginTop: 16,
    alignItems: "center",
    elevation: 4,
  },

  balanceLabel: { color: "#777" },
  balanceAmount: { fontSize: 32, fontWeight: "700" },

  owe: { color: "#EF4444" },
  owed: { color: "#10B981" },
  settled: { color: "#888" },

  balanceMeta: {
    flexDirection: "row",
    gap: 16,
    marginTop: 8,
  },

  meta: { color: "#666", fontSize: 12 },

  actions: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 20,
    marginVertical: 16,
  },

  actionBtn: {
    flex: 1,
    height: 46,
    backgroundColor: "#1F1F1F",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },

  whatsappBtn: {
    flex: 1,
    height: 46,
    backgroundColor: "#1A2F23",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    borderWidth: 1,
    borderColor: "#25D366",
  },

  whatsappText: { color: "#25D366", fontWeight: "600" },

  smsBtn: {
    flex: 1,
    height: 46,
    backgroundColor: "#1F1F1F",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },

  smsText: { color: "#3B82F6", fontWeight: "600" },

  credit: { color: "#10B981", fontWeight: "600" },
  debit: { color: "#EF4444", fontWeight: "600" },
  payment: { color: "#F59E0B", fontWeight: "600" },

  methodBadge: {
    backgroundColor: "rgba(245, 158, 11, 0.12)",
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  methodText: { color: "#F59E0B", fontSize: 10, fontWeight: "600" },

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

  entryAmount: { fontSize: 18, fontWeight: "600" },
  entryDate: { color: "#777", marginTop: 2 },
  entryBalance: { color: "#888", marginTop: 4, fontSize: 13 },
  entryNote: { color: "#666", fontStyle: "italic", marginTop: 4 },

  emptyText: {
    color: "#888",
    textAlign: "center",
    marginTop: 12,
    fontSize: 15,
  },
  emptyHint: { color: "#666", textAlign: "center", marginTop: 4, fontSize: 12 },
});
