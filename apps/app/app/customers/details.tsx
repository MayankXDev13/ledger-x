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
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "@/lib/supabase";
import {
  Contact,
  LedgerEntry,
} from "@/types/database";
import { format } from "date-fns";
import { EditTransactionModal } from "@/components/EditTransactionModal";
import { DeleteConfirmationDialog } from "@/components/DeleteConfirmationDialog";
import {
  updateTransaction,
  deleteTransaction,
} from "@/lib/transactions";
import { formatCurrency } from "@/types/database";

interface BalanceData {
  total_credit: number;
  total_debit: number;
  balance: number;
}

export default function CustomerDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();

  const [contact, setContact] = useState<Contact | null>(null);
  const [entries, setEntries] = useState<
    (LedgerEntry & { running_balance?: number })[]
  >([]);
  const [balance, setBalance] = useState<BalanceData>({
    total_credit: 0,
    total_debit: 0,
    balance: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [editingTransaction, setEditingTransaction] =
    useState<LedgerEntry | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteEntryId, setDeleteEntryId] = useState<string | null>(null);

  /* -------------------- DATA -------------------- */

  const fetchData = async () => {
    if (!id) return;

    setLoading(true);

    const { data: contactData } = await supabase
      .from("contacts")
      .select("*")
      .eq("id", id)
      .single();

    if (contactData) setContact(contactData);

    // Fetch balance first so we can compute running balances reliably
    const startingBalance = await fetchBalance();
    await fetchTransactions(startingBalance ?? undefined);

    setLoading(false);
  };

  const fetchTransactions = async (startingBalanceParam?: number) => {
    if (!id) return;

    const { data } = await supabase
      .from("ledger_entries")
      .select("*")
      .eq("contact_id", id)
      .order("created_at", { ascending: false });

    // Compute running (post-transaction) balance for each entry.
    // data is ordered newest -> oldest (created_at descending)
    let running =
      typeof startingBalanceParam === "number"
        ? startingBalanceParam
        : (balance.balance ?? 0);

    const withRunning = (data || []).map((entry: LedgerEntry) => {
      const entryWithRunning = { ...entry, running_balance: running };
      const amt = Number(entry.amount || 0);
      // Reverse the effect so the next (older) entry gets its post-transaction balance
      if (entry.type === "credit") {
        // credit increases the balance
        running = running - amt;
      } else {
        // debit decreases the balance
        running = running + amt;
      }
      return entryWithRunning;
    });

    setEntries(withRunning);
  };

  const fetchBalance = async (): Promise<number | null> => {
    if (!id) return null;

    const { data } = await supabase.rpc("get_contact_balance", {
      contact_id: id,
    });

    if (data?.length) {
      setBalance(data[0]);
      return data[0].balance;
    }

    return null;
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

  const sendSMS = () => {
    if (!contact) return;

    const text =
      balance.balance > 0
        ? `You owe ₹${balance.balance.toFixed(2)}`
        : balance.balance < 0
          ? `We owe you ₹${Math.abs(balance.balance).toFixed(2)}`
          : "All settled up";

    const message = `Ledger Update - LedgerX\n\nCustomer: ${contact.name}\nBalance: ${text}`;
    const phone = contact.phone.replace(/\D/g, "");

    Linking.openURL(`sms:${phone}?body=${encodeURIComponent(message)}`);
  };

  const sendWhatsApp = async () => {
    if (!contact) return;

    const text =
      balance.balance > 0
        ? `You owe ₹${balance.balance.toFixed(2)}`
        : balance.balance < 0
          ? `We owe you ₹${Math.abs(balance.balance).toFixed(2)}`
          : "All settled up";

    const message = `Ledger Update - LedgerX\n\nCustomer: ${contact.name}\nBalance: ${text}`;
    const phone = contact.phone.replace(/\D/g, "");
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

    Linking.openURL(url).catch(() => {
      Alert.alert("WhatsApp not available", "Try sending SMS instead");
    });
  };

  /* -------------------- RENDER -------------------- */

  if (loading || !contact) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  const renderEntry = ({
    item,
  }: {
    item: LedgerEntry & { running_balance?: number };
  }) => (
    <Pressable
      style={styles.entryCard}
      onPress={() => setEditingTransaction(item)}
    >
      <View>
        <Text
          style={[
            styles.entryAmount,
            item.type === "credit" ? styles.credit : styles.debit,
          ]}
        >
          {formatAmount(Number(item.amount), item.type)}
        </Text>
        <Text style={styles.entryDate}>
          {format(new Date(item.created_at), "dd MMM yyyy, hh:mm a")}
        </Text>
        {/* Post-transaction running balance for this row */}
        {typeof item.running_balance !== "undefined" && (
          <Text
            style={[
              styles.entryBalance,
              item.running_balance > 0
                ? styles.owe
                : item.running_balance < 0
                  ? styles.owed
                  : styles.settled,
            ]}
          >
            {formatCurrency(Math.abs(Number(item.running_balance || 0)))}
          </Text>
        )}
        {item.note ? <Text style={styles.entryNote}>{item.note}</Text> : null}
      </View>
      <Ionicons name="chevron-forward" size={18} color="#666" />
    </Pressable>
  );

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.name}>{contact.name}</Text>
            <Text style={styles.phone}>{contact.phone}</Text>
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
            <Text style={styles.meta}>Credit ₹{balance.total_credit}</Text>
            <Text style={styles.meta}>Debit ₹{balance.total_debit}</Text>
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
          <Text style={styles.debit}>Debit</Text>
        </Pressable>

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
          <Text style={styles.emptyText}>No transactions yet</Text>
        }
      />

      {/* MODALS */}
      <EditTransactionModal
        visible={!!editingTransaction}
        transaction={editingTransaction}
        onClose={() => setEditingTransaction(null)}
        onSave={updateTransaction}
        onDelete={(id) => {
          setDeleteEntryId(id);
          setShowDeleteConfirm(true);
        }}
      />

      <DeleteConfirmationDialog
        visible={showDeleteConfirm}
        title="Delete Transaction?"
        message="This action cannot be undone."
        confirmText="Delete"
        onConfirm={() => {
          if (deleteEntryId) deleteTransaction(deleteEntryId);
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
  },

  name: { fontSize: 26, fontWeight: "700", color: "#fff" },
  phone: { color: "#888", marginTop: 4 },

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
    borderBottomWidth: 1,
    borderBottomColor: "#222",
    flexDirection: "row",
    justifyContent: "space-between",
  },

  entryAmount: { fontSize: 18, fontWeight: "600" },
  entryDate: { color: "#777", marginTop: 2 },
  entryBalance: { color: "#888", marginTop: 4, fontSize: 13 },
  entryNote: { color: "#666", fontStyle: "italic", marginTop: 4 },

  emptyText: { color: "#666", textAlign: "center", paddingVertical: 40 },
});
