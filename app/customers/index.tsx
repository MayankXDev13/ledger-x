import React, { useCallback, useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  Pressable,
  ActivityIndicator,
  TextInput,
} from "react-native";
import { router, useFocusEffect, Link } from "expo-router";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { Contact } from "@/types/database";

export default function CustomersScreen() {
  const { session, loading: authLoading } = useAuth();

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // 🔹 Fetch contacts
  const fetchContacts = async () => {
    if (!session?.user) return;

    setLoading(true);
    const { data, error } = await supabase
      .from("contacts")
      .select("*")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching contacts:", error);
    } else {
      setContacts(data ?? []);
    }
    setLoading(false);
  };

  // 🔹 Refetch when screen gains focus
  useFocusEffect(
    useCallback(() => {
      if (session) {
        fetchContacts();
      }
    }, [session])
  );

  // 🔹 AUTH GUARD (FIXED)
  useEffect(() => {
    if (!authLoading && !session) {
      router.replace("/auth/login");
    }
  }, [authLoading, session]);

  // 🔹 Wait for auth restoration
  if (authLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#000000" />
      </View>
    );
  }

  // 🔹 Session missing (redirect in progress)
  if (!session) {
    return null;
  }

  const filteredContacts = contacts.filter(
    (contact) =>
      contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.phone.includes(searchQuery)
  );

  const renderContact = ({ item }: { item: Contact }) => (
    <Link href={`/customers/details?id=${item.id}`} asChild>
      <Pressable style={styles.contactCard}>
        <View style={styles.contactInfo}>
          <Text style={styles.contactName}>{item.name}</Text>
          <Text style={styles.contactPhone}>{item.phone}</Text>
        </View>
        <Text style={styles.arrow}>›</Text>
      </Pressable>
    </Link>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Customers</Text>
        <Text style={styles.subtitle}>
          {filteredContacts.length} contacts
        </Text>
      </View>

      <TextInput
        style={styles.searchInput}
        placeholder="Search customers..."
        placeholderTextColor="#999999"
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#000000" />
        </View>
      ) : filteredContacts.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>
            {searchQuery ? "No customers found" : "No customers yet"}
          </Text>
          {!searchQuery && (
            <Text style={styles.emptySubtext}>
              Tap + to add your first customer
            </Text>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredContacts}
          renderItem={renderContact}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      <Link href="/customers/add" asChild>
        <Pressable style={styles.fab}>
          <Text style={styles.fabText}>+</Text>
        </Pressable>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#000000",
  },
  subtitle: {
    fontSize: 16,
    color: "#666666",
    marginTop: 4,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: "#CCCCCC",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 24,
    marginBottom: 16,
    fontSize: 16,
    color: "#000000",
  },
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 18,
    color: "#666666",
  },
  emptySubtext: {
    fontSize: 14,
    color: "#999999",
    marginTop: 8,
  },
  listContent: {
    paddingHorizontal: 24,
    paddingBottom: 100,
  },
  contactCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 18,
    fontWeight: "500",
    color: "#000000",
  },
  contactPhone: {
    fontSize: 14,
    color: "#666666",
    marginTop: 4,
  },
  arrow: {
    fontSize: 22,
    color: "#CCCCCC",
    marginLeft: 12,
  },
  fab: {
    position: "absolute",
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#000000",
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
  },
  fabText: {
    fontSize: 28,
    color: "#FFFFFF",
    lineHeight: 32,
  },
});
