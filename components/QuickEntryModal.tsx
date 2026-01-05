import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  Modal,
  TextInput,
  Pressable,
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { Contact, TransactionTag } from "@/types/database";
import {
  getUserTransactionTags,
  replaceTransactionTags,
} from "@/lib/transaction-tags";
import { TransactionTagSelector } from "@/components/TransactionTagSelector";
import { TransactionTagManagementModal } from "@/components/TransactionTagManagementModal";

interface QuickEntryModalProps {
  visible: boolean;
  onClose: () => void;
  type: "credit" | "debit";
  onEntryAdded?: () => void;
}

export function QuickEntryModal({
  visible,
  onClose,
  type,
  onEntryAdded,
}: QuickEntryModalProps) {
  const { session } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableTags, setAvailableTags] = useState<TransactionTag[]>([]);
  const [selectedTags, setSelectedTags] = useState<TransactionTag[]>([]);
  const [showTagModal, setShowTagModal] = useState(false);

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

  const fetchTags = useCallback(async () => {
    if (!session?.user) return;
    const tags = await getUserTransactionTags(session.user.id);
    setAvailableTags(tags);
  }, [session]);

  useEffect(() => {
    if (visible) {
      fetchContacts();
      fetchTags();
    }
  }, [visible, fetchTags]);

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

  const handleSubmit = async () => {
    if (!selectedContact || !amount) return;

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) return;

    setSubmitting(true);
    setError(null);

    const { data: entryData, error: insertError } = await supabase
      .from("ledger_entries")
      .insert({
        contact_id: selectedContact.id,
        amount: numAmount,
        type,
        note: note || null,
      })
      .select()
      .single();

    if (insertError) {
      setError(insertError.message);
      setSubmitting(false);
      return;
    }

    if (selectedTags.length > 0) {
      const tagIds = selectedTags.map((t) => t.id);
      await replaceTransactionTags(entryData.id, tagIds);
    }

    setSubmitting(false);
    handleClose();
    onEntryAdded?.();
  };

  const handleClose = () => {
    setSelectedContact(null);
    setAmount("");
    setNote("");
    setSearchQuery("");
    setSelectedTags([]);
    setError(null);
    onClose();
  };

  const renderContactItem = ({ item }: { item: Contact }) => (
    <Pressable
      className={`flex-row items-center justify-between py-3 border-b border-[#333] ${selectedContact?.id === item.id ? "bg-[#2a2a2a] -mx-3 px-3" : ""}`}
      onPress={() => setSelectedContact(item)}
    >
      <View className="flex-1">
        <Text className="text-white font-medium text-base">{item.name}</Text>
        <Text className="text-[#888] text-sm mt-0.5">{item.phone}</Text>
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
        className="flex-1 bg-[#1a1a1a]"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View className="flex-row items-center justify-between px-6 pt-[60px] pb-4 border-b border-[#333]">
          <Pressable onPress={handleClose}>
            <Text className="text-[#888] text-base">Cancel</Text>
          </Pressable>
          <Text className="text-white text-xl font-semibold">
            {type === "credit" ? "Add Credit" : "Add Debit"}
          </Text>
          <View className="w-[60px]" />
        </View>

        <View className="flex-1">
          {loading ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator size="large" color="#ffffff" />
            </View>
          ) : (
            <>
              <View className="px-6 py-4">
                <Text className="text-[#888] text-sm font-medium mb-3">
                  Select Customer
                </Text>
                <View className="flex-row items-center bg-[#2a2a2a] rounded-lg px-3 gap-2">
                  <Ionicons name="search" size={18} color="#666" />
                  <TextInput
                    className="flex-1 py-3 text-white text-base"
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
                className="flex-1 px-6"
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                  <Text className="text-center text-[#666] mt-8">
                    No customers found
                  </Text>
                }
              />
            </>
          )}
        </View>

        <View className="px-6 pb-8 pt-4 border-t border-[#333] gap-3">
          {error && <Text className="text-red-500 text-sm">{error}</Text>}

          <View className="flex-row items-center bg-[#2a2a2a] rounded-lg px-4">
            <Text className="text-white text-xl font-semibold">₹</Text>
            <TextInput
              className="flex-1 py-4 text-xl font-semibold text-white"
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
            className="bg-[#2a2a2a] rounded-lg px-4 py-3 text-white text-base min-h-12"
            placeholder="Add a note (optional)"
            placeholderTextColor="#666"
            value={note}
            onChangeText={setNote}
            multiline
          />

          <TransactionTagSelector
            selectedTags={selectedTags}
            onTagsChange={setSelectedTags}
            availableTags={availableTags}
            onManageTags={() => setShowTagModal(true)}
          />

          <Pressable
            className={`py-4 rounded-lg items-center ${!selectedContact || !amount || submitting ? "opacity-50" : ""}`}
            onPress={handleSubmit}
            disabled={!selectedContact || !amount || submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text className="text-black text-base font-semibold">
                {type === "credit" ? "Add Credit" : "Add Debit"}
              </Text>
            )}
          </Pressable>
        </View>

        <TransactionTagManagementModal
          visible={showTagModal}
          onClose={() => {
            setShowTagModal(false);
            fetchTags();
          }}
          tags={availableTags}
          onTagsChange={setAvailableTags}
          userId={session?.user?.id || ""}
        />
      </KeyboardAvoidingView>
    </Modal>
  );
}
