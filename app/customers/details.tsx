import { useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  Pressable,
  ActivityIndicator,
  Linking,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { supabase } from "@/lib/supabase";
import { Contact, LedgerEntry } from "@/types/database";
import { format } from "date-fns";

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

    const { data: entriesData, error: entriesError } = await supabase
      .from("ledger_entries")
      .select("*")
      .eq("contact_id", id)
      .order("created_at", { ascending: false });

    if (entriesError) {
      console.error("Error fetching entries:", entriesError);
      return;
    }

    setEntries(entriesData || []);

    const { data: balanceData } = await supabase.rpc("get_contact_balance", {
      contact_id: id,
    });

    if (balanceData && balanceData.length > 0) {
      setBalance(balanceData[0] as BalanceData);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

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

  const renderEntry = ({ item }: { item: LedgerEntry }) => (
    <View style={styles.entryCard}>
      <View style={styles.entryInfo}>
        <Text style={styles.entryAmount}>
          {formatAmount(Number(item.amount), item.type)}
        </Text>
        <Text style={styles.entryDate}>
          {format(new Date(item.created_at), "MMM d, yyyy h:mm a")}
        </Text>
        {item.note && <Text style={styles.entryNote}>{item.note}</Text>}
      </View>
    </View>
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
        <View style={styles.customerInfo}>
          <Text style={styles.customerName}>{contact.name}</Text>
          <Text style={styles.customerPhone}>{contact.phone}</Text>
        </View>
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Balance</Text>
          <Text
            style={[
              styles.balanceAmount,
              balance.balance > 0 ? styles.balanceOwe : styles.balanceOwed,
            ]}
          >
            {balance.balance > 0
              ? "₹" + balance.balance.toFixed(2)
              : balance.balance < 0
                ? "-₹" + Math.abs(balance.balance).toFixed(2)
                : "Settled"}
          </Text>
        </View>
      </View>

      <View style={styles.actionsContainer}>
        <Pressable
          style={styles.actionButton}
          onPress={() => router.push(`/ledger/add?contactId=${id}&type=credit`)}
        >
          <Text style={styles.actionButtonText}>+ Credit</Text>
        </Pressable>
        <Pressable
          style={styles.actionButton}
          onPress={() => router.push(`/ledger/add?contactId=${id}&type=debit`)}
        >
          <Text style={styles.actionButtonText}>+ Debit</Text>
        </Pressable>
        <Pressable
          style={[styles.actionButton, styles.smsButton]}
          onPress={sendSMS}
        >
          <Text style={styles.smsButtonText}>SMS</Text>
        </Pressable>
      </View>

      <Text style={styles.sectionTitle}>Transactions</Text>

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
        />
      )}
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
  customerInfo: {
    marginBottom: 16,
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
  balanceCard: {
    backgroundColor: "#2a2a2a",
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
    color: "#ffffff",
  },
  balanceOwed: {
    color: "#aaaaaa",
  },
  actionsContainer: {
    flexDirection: "row",
    paddingHorizontal: 24,
    gap: 12,
    marginBottom: 24,
  },
  actionButton: {
    flex: 1,
    backgroundColor: "#ffffff",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  actionButtonText: {
    color: "#000000",
    fontSize: 16,
    fontWeight: "600",
  },
  smsButton: {
    backgroundColor: "#2a2a2a",
    flex: 0.6,
  },
  smsButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#ffffff",
    paddingHorizontal: 24,
    marginBottom: 12,
  },
  listContent: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  entryCard: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#333333",
  },
  entryInfo: {
    flex: 1,
  },
  entryAmount: {
    fontSize: 18,
    fontWeight: "600",
    color: "#ffffff",
  },
  entryDate: {
    fontSize: 14,
    color: "#888888",
    marginTop: 4,
  },
  entryNote: {
    fontSize: 14,
    color: "#666666",
    marginTop: 4,
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
});
