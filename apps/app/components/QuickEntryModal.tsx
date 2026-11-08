import React, { useState, useEffect } from "react";
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
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { customersApi, type Customer } from "@/lib/api";
import { PaymentMethodSelector } from "@/components/PaymentMethodSelector";
import { useOfflineQueue } from "@/hooks/useOfflineQueue";
import type { PaymentMethod } from "@/lib/api";

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
  const insets = useSafeAreaInsets();
  const { queueTransaction, outstanding, isOnline } = useOfflineQueue();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const data = await customersApi.list();
      setCustomers(data);
      setFilteredCustomers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load customers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible) {
      fetchCustomers();
    }
  }, [visible]);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredCustomers(customers);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredCustomers(
        customers.filter(
          (c) =>
            c.name.toLowerCase().includes(query) ||
            c.phone.includes(searchQuery),
        ),
      );
    }
  }, [searchQuery, customers]);

  const handleSubmit = async () => {
    if (!selectedCustomer || !amount) return;

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) return;

    setSubmitting(true);
    setError(null);

    try {
      // Writes go through the offline queue: online they land immediately,
      // offline they are stored with a device UUID and replayed later.
      await queueTransaction({
        customerId: selectedCustomer.id,
        amount: numAmount,
        type,
        paymentMethod,
        note: note || undefined,
      });
      handleClose();
      onEntryAdded?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save entry");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedCustomer(null);
    setAmount("");
    setNote("");
    setPaymentMethod(null);
    setSearchQuery("");
    setError(null);
    onClose();
  };

  const renderCustomerItem = ({ item }: { item: Customer }) => (
    <Pressable
      className={`flex-row items-center justify-between py-3 border-b border-brand-border ${selectedCustomer?.id === item.id ? "bg-brand-card -mx-3 px-3" : ""}`}
      onPress={() => setSelectedCustomer(item)}
    >
      <View className="flex-1">
        <Text className="text-white font-medium text-base">{item.name}</Text>
        <Text className="text-brand-muted text-sm mt-0.5">{item.phone}</Text>
      </View>
      {selectedCustomer?.id === item.id && (
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
        className="flex-1 bg-brand-dark"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View
          className="flex-row items-center justify-between px-6 border-b border-brand-border"
          style={{ paddingTop: insets.top + 12, paddingBottom: 12 }}
        >
          <Pressable onPress={handleClose}>
            <Text className="text-brand-muted text-base">Cancel</Text>
          </Pressable>
          <Text className="text-white text-xl font-semibold">
            {type === "credit" ? "Add Credit" : "Add Payment"}
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
                <Text className="text-brand-muted text-sm font-medium mb-3">
                  Select Customer
                </Text>
                <View className="flex-row items-center bg-brand-card rounded-lg px-3 gap-2">
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
                data={filteredCustomers}
                renderItem={renderCustomerItem}
                keyExtractor={(item) => item.id}
                className="flex-1"
                contentContainerStyle={{
                  paddingHorizontal: 24,
                  paddingBottom: insets.bottom + 16,
                }}
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

        <View
          className="px-6 pt-4 border-t border-brand-border gap-3"
          style={{ paddingBottom: insets.bottom + 12 }}
        >
          <ScrollView bounces={false}>
            {error && <Text className="text-red-500 text-sm">{error}</Text>}

            <View className="flex-row items-center bg-brand-card rounded-lg px-4">
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

            {/* Payment method (recorded on payments and credits alike) */}
            <View className="mt-3">
              <PaymentMethodSelector
                value={paymentMethod}
                onChange={setPaymentMethod}
              />
            </View>

            <TextInput
              className="bg-brand-card rounded-lg px-4 py-3 text-white text-base min-h-12 mt-3"
              placeholder="Add a note (optional)"
              placeholderTextColor="#666"
              value={note}
              onChangeText={setNote}
              multiline
            />

            {!isOnline && (
              <Text className="text-[#F59E0B] text-xs mt-2">
                Offline — this entry is saved on device and syncs when you
                reconnect ({outstanding} pending).
              </Text>
            )}

            <Pressable
              className={`py-4 rounded-lg items-center mt-4 ${!selectedCustomer || !amount || submitting ? "opacity-50" : ""}`}
              onPress={handleSubmit}
              disabled={!selectedCustomer || !amount || submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text className="text-black text-base font-semibold">
                  {type === "credit" ? "Add Credit" : "Record Payment"}
                </Text>
              )}
            </Pressable>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
