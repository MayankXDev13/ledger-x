import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "@/lib/supabase";
import { Contact } from "@/types/database";

interface QuickEntryModalProps {
  visible: boolean;
  onClose: () => void;
  type: "credit" | "debit";
}

export function QuickEntryModal({
  visible,
  onClose,
  type,
}: QuickEntryModalProps) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      fetchContacts();
    }
  }, [visible]);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredContacts(contacts);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredContacts(
        contacts.filter(
          (c) =>
            c.name.toLowerCase().includes(query) ||
            c.phone.includes(searchQuery),
        ),
      );
    }
  }, [searchQuery, contacts]);

  const fetchContacts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("contacts")
      .select("*")
      .is("deleted_at", null)
      .order("name", { ascending: true });

    if (error) {
      console.error("Error fetching contacts:", error);
    } else {
      setContacts(data ?? []);
      setFilteredContacts(data ?? []);
    }
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!selectedContact || !amount) return;

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) return;

    setSubmitting(true);
    setError(null);

    const { error: insertError } = await supabase
      .from("ledger_entries")
      .insert({
        contact_id: selectedContact.id,
        amount: numAmount,
        type,
        note: note || null,
      });

    if (insertError) {
      setError(insertError.message);
    } else {
      handleClose();
    }
    setSubmitting(false);
  };

  const handleClose = () => {
    setSelectedContact(null);
    setAmount("");
    setNote("");
    setSearchQuery("");
    setError(null);
    onClose();
  };

  const renderContactItem = ({ item }: { item: Contact }) => (
    <Pressable
      style={[
        styles.contactItem,
        selectedContact?.id === item.id && styles.contactItemSelected,
      ]}
      onPress={() => setSelectedContact(item)}
    >
      <View style={styles.contactInfo}>
        <Text style={styles.contactName}>{item.name}</Text>
        <Text style={styles.contactPhone}>{item.phone}</Text>
      </View>
      {selectedContact?.id === item.id && (
        <Ionicons name="checkmark-circle" size={24} color="#10B981" />
      )}
    </Pressable>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.header}>
          <Pressable onPress={handleClose}>
            <Text style={styles.cancelButton}>Cancel</Text>
          </Pressable>
          <Text style={styles.title}>
            {type === "credit" ? "Add Credit" : "Add Debit"}
          </Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.content}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#ffffff" />
            </View>
          ) : (
            <>
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Select Customer</Text>
                <View style={styles.searchContainer}>
                  <Ionicons name="search" size={18} color="#666" />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search customers..."
                    placeholderTextColor="#666"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                  />
                </View>
              </View>

              <FlatList
                data={filteredContacts}
                renderItem={renderContactItem}
                keyExtractor={(item) => item.id}
                style={styles.contactList}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                  <Text style={styles.emptyText}>No customers found</Text>
                }
              />
            </>
          )}
        </View>

        <View style={styles.footer}>
          {error && <Text style={styles.errorText}>{error}</Text>}

          <View style={styles.inputRow}>
            <Text style={styles.currencySymbol}>₹</Text>
            <TextInput
              style={styles.amountInput}
              placeholder="0.00"
              placeholderTextColor="#666"
              value={amount}
              onChangeText={(text) => {
                const filtered = text.replace(/[^0-9.]/g, "");
                setAmount(filtered);
              }}
              keyboardType="decimal-pad"
            />
          </View>

          <TextInput
            style={styles.noteInput}
            placeholder="Add a note (optional)"
            placeholderTextColor="#666"
            value={note}
            onChangeText={setNote}
            multiline
          />

          <Pressable
            style={[
              styles.submitButton,
              (!selectedContact || !amount || submitting) &&
                styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={!selectedContact || !amount || submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text style={styles.submitButtonText}>
                {type === "credit" ? "Add Credit" : "Add Debit"}
              </Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a1a",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  cancelButton: {
    fontSize: 16,
    color: "#888",
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    color: "#ffffff",
  },
  placeholder: {
    width: 60,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  section: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#888",
    marginBottom: 12,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2a2a2a",
    borderRadius: 8,
    paddingHorizontal: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: "#ffffff",
  },
  contactList: {
    flex: 1,
    paddingHorizontal: 24,
  },
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  contactItemSelected: {
    backgroundColor: "#2a2a2a",
    marginHorizontal: -12,
    paddingHorizontal: 12,
    borderBottomColor: "#333",
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#ffffff",
  },
  contactPhone: {
    fontSize: 14,
    color: "#888",
    marginTop: 2,
  },
  emptyText: {
    textAlign: "center",
    color: "#666",
    marginTop: 32,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#333",
    gap: 12,
  },
  errorText: {
    color: "#EF4444",
    fontSize: 14,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2a2a2a",
    borderRadius: 8,
    paddingHorizontal: 16,
  },
  currencySymbol: {
    fontSize: 24,
    fontWeight: "600",
    color: "#ffffff",
  },
  amountInput: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 24,
    fontWeight: "600",
    color: "#ffffff",
  },
  noteInput: {
    backgroundColor: "#2a2a2a",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: "#ffffff",
    minHeight: 48,
  },
  submitButton: {
    backgroundColor: "#ffffff",
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: "center",
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000000",
  },
});
