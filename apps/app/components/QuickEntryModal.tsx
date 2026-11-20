import React, { useState, useEffect, useMemo } from "react";
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
import type { Customer, PaymentMethod } from "@/lib/api";
import { PaymentMethodSelector } from "@/components/PaymentMethodSelector";
import { useOfflineQueue } from "@/hooks/useOfflineQueue";
import { useCustomers } from "@/hooks/useCustomers";
import { parseWholeRupeAmount } from "@/lib/amount";
import { colors } from "@/lib/theme";
import { announce } from "@/lib/announce";

interface QuickEntryModalProps {
  visible: boolean;
  onClose: () => void;
  type: "credit" | "debit";
  initialPaymentMethod?: PaymentMethod | null;
  onEntryAdded?: () => void;
}

export function QuickEntryModal({
  visible,
  onClose,
  type,
  initialPaymentMethod = null,
  onEntryAdded,
}: QuickEntryModalProps) {
  const insets = useSafeAreaInsets();
  const { queueTransaction, outstanding, isOnline } = useOfflineQueue();
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const customersQuery = useCustomers(visible);
  const customers = customersQuery.data ?? [];
  const loading = customersQuery.isLoading;

  useEffect(() => {
    if (visible) {
      setPaymentMethod(initialPaymentMethod ?? null);
    }
  }, [visible, initialPaymentMethod]);

  useEffect(() => {
    if (customersQuery.error) {
      setError(
        customersQuery.error instanceof Error
          ? customersQuery.error.message
          : "Failed to load customers",
      );
    }
  }, [customersQuery.error]);

  const filteredCustomers = useMemo(() => {
    if (searchQuery.trim() === "") return customers;
    const query = searchQuery.toLowerCase();
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(query) || c.phone.includes(searchQuery),
    );
  }, [searchQuery, customers]);

  const handleSubmit = async () => {
    if (!selectedCustomer) {
      setError("Choose a customer first");
      announce("Choose a customer first");
      return;
    }

    const parsed = parseWholeRupeAmount(amount);
    if (!parsed.ok) {
      setError(parsed.error);
      announce(parsed.error);
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // Writes go through the offline queue: online they land immediately,
      // offline they are stored with a device UUID and replayed later.
      await queueTransaction({
        customerId: selectedCustomer.id,
        amount: parsed.amount,
        type,
        paymentMethod,
        note: note || undefined,
      });
      handleClose();
      onEntryAdded?.();
      announce(
        type === "credit"
          ? "Credit added to the ledger"
          : "Payment recorded",
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not save entry";
      setError(message);
      announce(message);
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
            accessibilityRole="button"
      accessibilityLabel={`Select ${item.name}`}
      accessibilityState={{ selected: selectedCustomer?.id === item.id }}
      className={`flex-row items-center justify-between py-3 border-b border-line ${selectedCustomer?.id === item.id ? "bg-surface -mx-3 px-3" : ""}`}
      onPress={() => setSelectedCustomer(item)}
    >
      <View className="flex-1">
        <Text className="text-white font-medium text-base">{item.name}</Text>
        <Text className="text-ink-muted text-sm mt-0.5">{item.phone}</Text>
      </View>
      {selectedCustomer?.id === item.id && (
        <Ionicons name="checkmark-circle" size={24} color={colors.brand} />
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
        className="flex-1 bg-bg"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View
          className="flex-row items-center justify-between px-5 border-b border-line"
          style={{ paddingTop: insets.top + 12, paddingBottom: 12 }}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Cancel"
            onPress={handleClose}>
            <Text className="text-ink-muted text-base">Cancel</Text>
          </Pressable>
          <Text className="text-white text-xl font-semibold">
            {type === "credit" ? "You Gave (Udhar)" : "You Got (Payment)"}
          </Text>
          <View className="w-[60px]" />
        </View>

        <View className="flex-1">
          {loading ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator size="large" color={colors.ink} />
            </View>
          ) : (
            <>
              <View className="px-5 py-4">
                <Text className="text-ink-muted text-sm font-medium mb-3">
                  Select Customer
                </Text>
                <View className="flex-row items-center bg-surface rounded-lg px-3 gap-2">
                  <Ionicons name="search" size={18} color={colors.inkMuted} />
                  <TextInput
                    className="flex-1 py-3 text-white text-base"
                    placeholder="Search customers..."
                    placeholderTextColor={colors.inkFaint}
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
                  <Text className="text-center text-ink-muted mt-8">
                    No customers found
                  </Text>
                }
              />
            </>
          )}
        </View>

        <View
          className="px-5 pt-4 border-t border-line gap-3"
          style={{ paddingBottom: insets.bottom + 12 }}
        >
          <ScrollView bounces={false}>
            {error ? (
              <Text accessibilityLiveRegion="polite" className="text-danger-text text-sm">
                {error}
              </Text>
            ) : null}

            <View className="flex-row items-center bg-surface rounded-lg px-4">
              <Text className="text-white text-xl font-semibold">₹</Text>
              <TextInput
                className="flex-1 py-4 text-xl font-semibold text-white"
                placeholder="0.00"
                placeholderTextColor={colors.inkFaint}
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
              className="bg-surface rounded-lg px-4 py-3 text-white text-base min-h-12 mt-3"
              placeholder="Add a note (optional)"
              placeholderTextColor={colors.inkFaint}
              value={note}
              onChangeText={setNote}
              multiline
            />

            {!isOnline && (
              <Text className="text-ink-muted text-xs mt-2">
                Offline — this entry is saved on device and syncs when you
                reconnect ({outstanding} pending).
              </Text>
            )}

            <Pressable
              className={`min-h-[52px] items-center justify-center rounded-xl bg-brand-primary-fill ${!selectedCustomer || !amount || submitting ? "opacity-50" : "active:opacity-80"}`}
              onPress={handleSubmit}
              disabled={!selectedCustomer || !amount || submitting}
              accessibilityRole="button"
              accessibilityLabel={type === "credit" ? "Add credit" : "Record payment"}
            >
              {submitting ? (
                <ActivityIndicator color={colors.ink} />
              ) : (
                <Text className="font-mukta-semibold text-[16px] text-white">
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
