import { useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { LedgerEntry } from "@/types/database";
import { format } from "date-fns";

export default function LedgerScreen() {
  const { session } = useAuth();
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEntries = async () => {
    if (!session?.user) return;

    setLoading(true);
    const { data, error } = await supabase
      .from("ledger_entries")
      .select("*, contacts(name, phone)")
      .eq("contacts.user_id", session.user.id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("Error fetching entries:", error);
    } else {
      setEntries(data ?? []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchEntries();
  }, [session]);

  if (!session) {
    return null;
  }

  const formatAmount = (amount: number, type: string) => {
    const formatted = new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
    return type === "credit" ? `+${formatted}` : `-${formatted}`;
  };

  const renderEntry = ({
    item,
  }: {
    item: LedgerEntry & { contacts?: { name: string; phone: string } };
  }) => (
    <View style={styles.entryCard}>
      <View style={styles.entryInfo}>
        <Text style={styles.entryCustomer}>
          {item.contacts?.name || "Unknown"}
        </Text>
        <Text style={styles.entryDate}>
          {format(new Date(item.created_at), "MMM d, yyyy h:mm a")}
        </Text>
        {item.note && <Text style={styles.entryNote}>{item.note}</Text>}
      </View>
      <Text
        style={[
          styles.entryAmount,
          item.type === "credit" ? styles.creditAmount : styles.debitAmount,
        ]}
      >
        {formatAmount(Number(item.amount), item.type)}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Ledger</Text>
        <Text style={styles.subtitle}>Recent transactions</Text>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#ffffff" />
        </View>
      ) : entries.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>No transactions yet</Text>
          <Text style={styles.emptySubtext}>
            Add your first entry from a customer
          </Text>
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
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#ffffff",
  },
  subtitle: {
    fontSize: 16,
    color: "#888888",
    marginTop: 4,
  },
  centerContainer: {
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
  listContent: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  entryCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#333333",
  },
  entryInfo: {
    flex: 1,
  },
  entryCustomer: {
    fontSize: 16,
    fontWeight: "500",
    color: "#ffffff",
  },
  entryDate: {
    fontSize: 13,
    color: "#666666",
    marginTop: 4,
  },
  entryNote: {
    fontSize: 13,
    color: "#888888",
    marginTop: 4,
    fontStyle: "italic",
  },
  entryAmount: {
    fontSize: 16,
    fontWeight: "600",
  },
  creditAmount: {
    color: "#4CAF50",
  },
  debitAmount: {
    color: "#FF5252",
  },
});
