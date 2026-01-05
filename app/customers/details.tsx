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
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "@/lib/supabase";
import {
  Contact,
  LedgerEntry,
  TagTotal,
  TransactionTag,
} from "@/types/database";
import { format } from "date-fns";
import { EditTransactionModal } from "@/components/EditTransactionModal";
import { DeleteConfirmationDialog } from "@/components/DeleteConfirmationDialog";
import {
  updateTransaction,
  deleteTransaction,
  getTransactionTagTotals,
} from "@/lib/transactions";
import { getUserTransactionTags } from "@/lib/transaction-tags";
import { formatCurrency } from "@/types/database";

interface BalanceData {
  total_credit: number;
  total_debit: number;
  balance: number;
}

export default function CustomerDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const [contact, setContact] = useState<Contact | null>(null);
  const [entriesWithTags, setEntriesWithTags] = useState<
    (LedgerEntry & { tags?: TransactionTag[] })[]
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

  const [tagTotals, setTagTotals] = useState<TagTotal[]>([]);
  const [selectedTagFilter, setSelectedTagFilter] = useState<string | null>(
    null,
  );
  const [showTagFilter, setShowTagFilter] = useState(false);
  const [transactionTags, setTransactionTags] = useState<TransactionTag[]>([]);

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

    await fetchTransactions();
    await fetchBalance();
    await fetchTagTotals();
    if (contactData?.user_id) {
      await fetchTransactionTags(contactData.user_id);
    }

    setLoading(false);
  };

  const fetchTransactions = async () => {
    if (!id) return;

    const { data } = await supabase
      .from("ledger_entries")
      .select("*")
      .eq("contact_id", id)
      .order("created_at", { ascending: false });

    const entriesWithTagsData = await Promise.all(
      (data || []).map(async (entry: LedgerEntry) => {
        const { getTransactionTags } = await import("@/lib/transaction-tags");
        const tags = await getTransactionTags(entry.id);
        return { ...entry, tags };
      }),
    );

    setEntriesWithTags(entriesWithTagsData);
  };

  const fetchBalance = async () => {
    if (!id) return;

    const { data } = await supabase.rpc("get_contact_balance", {
      contact_id: id,
    });

    if (data?.length) setBalance(data[0]);
  };

  const fetchTagTotals = async () => {
    if (!id) return;
    const totals = await getTransactionTagTotals(id);
    setTagTotals(totals);
  };

  const fetchTransactionTags = async (userId: string) => {
    if (!userId) return;
    const tags = await getUserTransactionTags(userId);
    setTransactionTags(tags);
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

  const filteredEntries = selectedTagFilter
    ? entriesWithTags.filter((entry) =>
        entry.tags?.some((tag) => tag.id === selectedTagFilter),
      )
    : entriesWithTags;

  const renderEntry = ({
    item,
  }: {
    item: LedgerEntry & { tags?: TransactionTag[] };
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
        {item.note ? <Text style={styles.entryNote}>{item.note}</Text> : null}
        {item.tags && item.tags.length > 0 && (
          <View style={styles.entryTags}>
            {item.tags.map((tag) => (
              <View
                key={tag.id}
                style={[styles.entryTag, { backgroundColor: tag.color + "30" }]}
              >
                <View
                  style={[styles.entryTagDot, { backgroundColor: tag.color }]}
                />
                <Text style={styles.entryTagText}>{tag.name}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
      <Ionicons name="chevron-forward" size={18} color="#666" />
    </Pressable>
  );

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
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

      {/* TAG TOTALS */}
      {tagTotals.length > 0 && (
        <View style={styles.tagTotalsContainer}>
          <Text style={styles.tagTotalsTitle}>💰 Tag Totals</Text>
          <View style={styles.tagTotalsList}>
            {tagTotals.map((total) => (
              <View
                key={total.tag_id}
                style={[
                  styles.tagTotalItem,
                  { backgroundColor: total.tag_color + "30" },
                ]}
              >
                <Text style={styles.tagTotalName}>{total.tag_name}</Text>
                <Text style={styles.tagTotalAmount}>
                  {formatCurrency(total.total_amount)}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* TAG FILTER */}
      <View style={styles.tagFilterContainer}>
        <Pressable
          style={styles.tagFilterButton}
          onPress={() => setShowTagFilter(!showTagFilter)}
        >
          <Text style={styles.tagFilterText}>
            Filter:{" "}
            {selectedTagFilter
              ? transactionTags.find((t) => t.id === selectedTagFilter)?.name ||
                "Tag"
              : "All"}
          </Text>
          <Ionicons
            name={showTagFilter ? "chevron-up" : "chevron-down"}
            size={20}
            color="#FFFFFF"
          />
        </Pressable>

        {showTagFilter && (
          <View style={styles.tagFilterDropdown}>
            <Pressable
              style={styles.tagFilterOption}
              onPress={() => {
                setSelectedTagFilter(null);
                setShowTagFilter(false);
              }}
            >
              <Text
                style={[
                  styles.tagFilterOptionText,
                  !selectedTagFilter && styles.tagFilterOptionTextSelected,
                ]}
              >
                All Transactions
              </Text>
            </Pressable>
            {transactionTags.map((tag) => (
              <Pressable
                key={tag.id}
                style={styles.tagFilterOption}
                onPress={() => {
                  setSelectedTagFilter(tag.id);
                  setShowTagFilter(false);
                }}
              >
                <View style={[styles.tagDot, { backgroundColor: tag.color }]} />
                <Text
                  style={[
                    styles.tagFilterOptionText,
                    selectedTagFilter === tag.id &&
                      styles.tagFilterOptionTextSelected,
                  ]}
                >
                  {tag.name}
                </Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>

      {/* TRANSACTIONS */}
      <View style={styles.txHeader}>
        <Text style={styles.txTitle}>Transactions</Text>
      </View>

      <FlatList
        data={filteredEntries}
        renderItem={renderEntry}
        keyExtractor={(i) => i.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            {selectedTagFilter
              ? "No transactions with this tag"
              : "No transactions yet"}
          </Text>
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

  tagTotalsContainer: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },

  tagTotalsTitle: { color: "#888", fontSize: 12, marginBottom: 8 },

  tagTotalsList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  tagTotalItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },

  tagTotalName: { color: "#fff", fontSize: 13, fontWeight: "500" },

  tagTotalAmount: { color: "#ccc", fontSize: 13 },

  tagFilterContainer: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },

  tagFilterButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#1F1F1F",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
  },

  tagFilterText: { color: "#fff", fontSize: 14 },

  tagFilterDropdown: {
    backgroundColor: "#1F1F1F",
    borderRadius: 10,
    marginTop: 6,
    padding: 8,
  },

  tagFilterOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 8,
    gap: 8,
  },

  tagFilterOptionText: { color: "#888", fontSize: 14 },

  tagFilterOptionTextSelected: {
    color: "#3B82F6",
    fontWeight: "600",
  },

  tagDot: { width: 8, height: 8, borderRadius: 4 },

  txHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginTop: 8,
  },

  txTitle: { color: "#fff", fontSize: 18, fontWeight: "600" },

  list: { paddingHorizontal: 20, paddingBottom: 120 },

  entryCard: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#222",
    flexDirection: "row",
    justifyContent: "space-between",
  },

  entryAmount: { fontSize: 18, fontWeight: "600" },
  entryDate: { color: "#777", marginTop: 2 },
  entryNote: { color: "#666", fontStyle: "italic", marginTop: 4 },

  entryTags: { flexDirection: "row", flexWrap: "wrap", gap: 4, marginTop: 6 },

  entryTag: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 4,
  },

  entryTagDot: { width: 6, height: 6, borderRadius: 3 },

  entryTagText: { color: "#ccc", fontSize: 11 },

  emptyText: { color: "#666", textAlign: "center", paddingVertical: 40 },
});
