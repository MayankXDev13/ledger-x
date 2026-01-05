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
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "@/lib/supabase";
import { Contact, ContactTag, LedgerEntry } from "@/types/database";
import { format } from "date-fns";
import { DateFilterDropdown } from "@/components/DateFilterDropdown";
import { EditTransactionModal } from "@/components/EditTransactionModal";
import { DeleteConfirmationDialog } from "@/components/DeleteConfirmationDialog";
import { TagSelector } from "@/components/TagSelector";
import { TagManagementModal } from "@/components/TagManagementModal";
import { DateFilter } from "@/types/database";
import { updateTransaction, deleteTransaction } from "@/lib/transactions";
import { getContactTags, replaceContactTags, getUserTags } from "@/lib/tags";

interface BalanceData {
  total_credit: number;
  total_debit: number;
  balance: number;
}

export default function CustomerDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [contact, setContact] = useState<Contact | null>(null);
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [balance, setBalance] = useState<BalanceData>({
    total_credit: 0,
    total_debit: 0,
    balance: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dateFilter, setDateFilter] = useState<DateFilter>({
    start: null,
    end: null,
    label: "All Time",
  });
  const [editingTransaction, setEditingTransaction] =
    useState<LedgerEntry | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedTags, setSelectedTags] = useState<ContactTag[]>([]);
  const [availableTags, setAvailableTags] = useState<ContactTag[]>([]);
  const [showTagModal, setShowTagModal] = useState(false);
  const [showDeleteCustomerConfirm, setShowDeleteCustomerConfirm] =
    useState(false);

  const fetchData = async () => {
    if (!id) return;

    const { data: contactData, error: contactError } = await supabase
      .from("contacts")
      .select("*")
      .eq("id", id)
      .single();

    if (contactError) {
      console.error("Error fetching contact:", contactError);
      return;
    }

    setContact(contactData);

    await fetchTransactions();
    await fetchBalance();
    await fetchTags();
  };

  const fetchTransactions = async () => {
    if (!id) return;

    const { data: entriesData, error: entriesError } = await supabase.rpc(
      "get_filtered_transactions",
      {
        p_contact_id: id,
        p_start_date: dateFilter.start,
        p_end_date: dateFilter.end,
      },
    );

    if (entriesError) {
      console.error("Error fetching entries:", entriesError);
      return;
    }

    setEntries(entriesData || []);
  };

  const fetchBalance = async () => {
    if (!id) return;

    const { data: balanceData } = await supabase.rpc("get_contact_balance", {
      contact_id: id,
    });

    if (balanceData && balanceData.length > 0) {
      setBalance(balanceData[0] as BalanceData);
    }
  };

  const fetchTags = async () => {
    if (!id) return;

    const contactTags = await getContactTags(id);
    setSelectedTags(contactTags);

    if (contact?.user_id) {
      const userTags = await getUserTags(contact.user_id);
      setAvailableTags(userTags);
    }
  };

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchTransactions();
    }
  }, [id, dateFilter]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const formatAmount = (amount: number, type: string) => {
    const formatted = new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
    return type === "credit" ? `+${formatted}` : `-${formatted}`;
  };

  const sendSMS = () => {
    if (!contact) return;

    const balanceText =
      balance.balance > 0
        ? `You owe ₹${balance.balance.toFixed(2)}`
        : balance.balance < 0
          ? `We owe you ₹${Math.abs(balance.balance).toFixed(2)}`
          : "All settled up";

    const message = `Ledger Update from LedgerX:\n\nCustomer: ${contact.name}\nBalance: ${balanceText}`;
    const phoneNumber = contact.phone.replace(/\D/g, "");

    Linking.openURL(`sms:${phoneNumber}?body=${encodeURIComponent(message)}`);
  };

  const handleSaveTransaction = async (
    entryId: string,
    amount: number,
    type: "credit" | "debit",
    note: string,
    createdAt: string,
  ) => {
    await updateTransaction(entryId, amount, type, note, createdAt);
    await fetchTransactions();
    await fetchBalance();
  };

  const handleDeleteTransaction = async (entryId: string) => {
    await deleteTransaction(entryId);
    await fetchTransactions();
    await fetchBalance();
  };

  const handleSaveTags = async () => {
    if (!id) return;
    const tagIds = selectedTags.map((t) => t.id);
    await replaceContactTags(id, tagIds);
  };

  const handleDeleteCustomer = async () => {
    if (!id) return;

    const { error } = await supabase.rpc("soft_delete_customer", {
      p_contact_id: id,
    });

    if (error) {
      console.error("Error deleting customer:", error);
      return;
    }

    router.replace("/(tabs)/customers");
  };

  const renderEntry = ({ item }: { item: LedgerEntry }) => (
    <Pressable
      style={styles.entryCard}
      onPress={() => setEditingTransaction(item)}
    >
      <View style={styles.entryInfo}>
        <Text
          style={[
            styles.entryAmount,
            item.type === "credit" ? styles.creditColor : styles.debitColor,
          ]}
        >
          {formatAmount(Number(item.amount), item.type)}
        </Text>
        <View style={styles.entryMeta}>
          <Text style={styles.entryDate}>
            {format(new Date(item.created_at), "MMM d, yyyy h:mm a")}
          </Text>
          {item.note && <Text style={styles.entryNote}>{item.note}</Text>}
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#666" />
    </Pressable>
  );

  if (!contact) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#ffffff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.customerInfo}>
            <Text style={styles.customerName}>{contact.name}</Text>
            <Text style={styles.customerPhone}>{contact.phone}</Text>
          </View>
          <Pressable
            style={styles.editButton}
            onPress={() => router.push(`/customers/edit?id=${id}`)}
          >
            <Ionicons name="pencil-outline" size={20} color="#3B82F6" />
            <Text style={styles.editButtonText}>Edit</Text>
          </Pressable>
        </View>

        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Balance</Text>
          <Text
            style={[
              styles.balanceAmount,
              balance.balance > 0
                ? styles.balanceOwe
                : balance.balance < 0
                  ? styles.balanceOwed
                  : styles.balanceSettled,
            ]}
          >
            {balance.balance > 0
              ? "₹" + balance.balance.toFixed(2)
              : balance.balance < 0
                ? "-₹" + Math.abs(balance.balance).toFixed(2)
                : "₹0.00"}
          </Text>
          <View style={styles.balanceDetails}>
            <Text style={styles.balanceDetailText}>
              Total Credit: ₹{Number(balance.total_credit).toFixed(2)}
            </Text>
            <Text style={styles.balanceDetailText}>
              Total Debit: ₹{Number(balance.total_debit).toFixed(2)}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.actionsContainer}>
        <Pressable
          style={styles.actionButton}
          onPress={() => router.push(`/ledger/add?contactId=${id}&type=credit`)}
        >
          <Ionicons name="arrow-down-circle" size={20} color="#10B981" />
          <Text style={styles.actionButtonText}>Credit</Text>
        </Pressable>
        <Pressable
          style={styles.actionButton}
          onPress={() => router.push(`/ledger/add?contactId=${id}&type=debit`)}
        >
          <Ionicons name="arrow-up-circle" size={20} color="#EF4444" />
          <Text style={styles.actionButtonText}>Debit</Text>
        </Pressable>
        <Pressable
          style={[styles.actionButton, styles.smsButton]}
          onPress={sendSMS}
        >
          <Ionicons name="chatbubble-ellipses" size={20} color="#3B82F6" />
          <Text style={styles.smsButtonText}>SMS</Text>
        </Pressable>
      </View>

      <View style={styles.tagsSection}>
        <TagSelector
          selectedTags={selectedTags}
          onTagsChange={(tags) => {
            setSelectedTags(tags);
            handleSaveTags();
          }}
          availableTags={availableTags}
          onManageTags={() => setShowTagModal(true)}
        />
      </View>

      <View style={styles.transactionsHeader}>
        <Text style={styles.sectionTitle}>Transactions</Text>
        <DateFilterDropdown
          selectedFilter={dateFilter}
          onFilterChange={setDateFilter}
        />
      </View>

      {entries.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No transactions yet</Text>
          <Text style={styles.emptySubtext}>Add a credit or debit entry</Text>
        </View>
      ) : (
        <FlatList
          data={entries}
          renderItem={renderEntry}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}

      <View style={styles.deleteSection}>
        <Pressable
          style={styles.deleteCustomerButton}
          onPress={() => setShowDeleteCustomerConfirm(true)}
        >
          <Ionicons name="trash-outline" size={20} color="#EF4444" />
          <Text style={styles.deleteCustomerButtonText}>Delete Customer</Text>
        </Pressable>
      </View>

      <EditTransactionModal
        visible={!!editingTransaction}
        transaction={editingTransaction}
        onClose={() => setEditingTransaction(null)}
        onSave={handleSaveTransaction}
        onDelete={(entryId) => {
          setEditingTransaction(null);
          setShowDeleteConfirm(true);
        }}
      />

      <DeleteConfirmationDialog
        visible={showDeleteConfirm}
        title="Delete Transaction?"
        message="This will permanently delete this transaction. The customer's balance will be updated accordingly."
        confirmText="Delete"
        onConfirm={() => {
          if (editingTransaction) {
            handleDeleteTransaction(editingTransaction.id);
          }
        }}
        onCancel={() => {
          setShowDeleteConfirm(false);
        }}
      />

      <DeleteConfirmationDialog
        visible={showDeleteCustomerConfirm}
        title="Delete Customer?"
        message="This will permanently delete this customer and all their transactions. This action cannot be undone."
        confirmText="Delete"
        onConfirm={handleDeleteCustomer}
        onCancel={() => setShowDeleteCustomerConfirm(false)}
      />

      <TagManagementModal
        visible={showTagModal}
        onClose={() => {
          setShowTagModal(false);
          if (contact?.user_id) {
            getUserTags(contact.user_id).then(setAvailableTags);
          }
        }}
        tags={availableTags}
        onTagsChange={setAvailableTags}
        userId={contact?.user_id || ""}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a1a",
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 16,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#ffffff",
  },
  customerPhone: {
    fontSize: 16,
    color: "#888888",
    marginTop: 4,
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: "#2D2D2D",
    borderRadius: 8,
  },
  editButtonText: {
    color: "#3B82F6",
    fontSize: 14,
    fontWeight: "500",
  },
  balanceCard: {
    backgroundColor: "#2D2D2D",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  balanceLabel: {
    fontSize: 14,
    color: "#888888",
    marginBottom: 4,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: "bold",
  },
  balanceOwe: {
    color: "#10B981",
  },
  balanceOwed: {
    color: "#EF4444",
  },
  balanceSettled: {
    color: "#888888",
  },
  balanceDetails: {
    flexDirection: "row",
    gap: 16,
    marginTop: 8,
  },
  balanceDetailText: {
    fontSize: 12,
    color: "#666",
  },
  actionsContainer: {
    flexDirection: "row",
    paddingHorizontal: 24,
    gap: 12,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: "#2D2D2D",
  },
  actionButtonText: {
    color: "#10B981",
    fontSize: 16,
    fontWeight: "600",
  },
  smsButton: {
    flex: 0.6,
  },
  smsButtonText: {
    color: "#3B82F6",
    fontSize: 16,
    fontWeight: "600",
  },
  tagsSection: {
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  transactionsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#ffffff",
  },
  listContent: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  entryCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#2D2D2D",
  },
  entryInfo: {
    flex: 1,
  },
  entryMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  entryAmount: {
    fontSize: 18,
    fontWeight: "600",
  },
  creditColor: {
    color: "#10B981",
  },
  debitColor: {
    color: "#EF4444",
  },
  entryDate: {
    fontSize: 14,
    color: "#888888",
  },
  entryNote: {
    fontSize: 14,
    color: "#666666",
    fontStyle: "italic",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 18,
    color: "#888888",
  },
  emptySubtext: {
    fontSize: 14,
    color: "#666666",
    marginTop: 8,
  },
  deleteSection: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "#2D2D2D",
    marginTop: 16,
  },
  deleteCustomerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
  },
  deleteCustomerButtonText: {
    color: "#EF4444",
    fontSize: 15,
    fontWeight: "500",
  },
});
