import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  TextInput,
  Modal,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { PaymentMethodSelector } from "@/components/PaymentMethodSelector";
import type { PaymentMethod, Transaction } from "@/lib/api";
import { parseWholeRupeAmount } from "@/lib/amount";
import { colors } from "@/lib/theme";
import { announce } from "@/lib/announce";

interface EditTransactionModalProps {
  visible: boolean;
  transaction: Transaction | null;
  onClose: () => void;
  onSave: (
    entryId: string,
    amount: number,
    type: "credit" | "debit",
    note: string,
    paymentMethod: PaymentMethod | null,
  ) => Promise<void> | void;
  onDelete: (entryId: string) => void;
}

export function EditTransactionModal({
  visible,
  transaction,
  onClose,
  onSave,
  onDelete,
}: EditTransactionModalProps) {
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<"credit" | "debit">("credit");
  const [note, setNote] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (transaction) {
      setAmount(transaction.amount.toString());
      setType(transaction.type);
      setNote(transaction.note || "");
      setPaymentMethod(transaction.paymentMethod ?? null);
    }
  }, [transaction]);

  const handleSave = async () => {
    if (!transaction) return;
    const parsed = parseWholeRupeAmount(amount);
    if (!parsed.ok) {
      setError(parsed.error);
      announce(parsed.error);
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await onSave(
        transaction.id,
        parsed.amount,
        type,
        note.trim(),
        paymentMethod,
      );
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    if (!transaction) return;
    onDelete(transaction.id);
    onClose();
  };

  if (!transaction) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        className="flex-1 bg-bg"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View className="flex-row justify-between items-center px-4 py-4 border-b border-line">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close"
            style={{ minWidth: 44, minHeight: 44, justifyContent: "center", alignItems: "center" }}
            onPress={onClose}>
            <Ionicons name="close" size={24} color={colors.ink} />
          </Pressable>
          <Text className="text-white text-lg font-semibold">
            Edit Transaction
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Save transaction"
            accessibilityState={{ disabled: saving, busy: saving }}
            onPress={handleSave}
            disabled={saving}>
            <Text className="text-brand-primary text-base font-semibold">
              {saving ? "Saving…" : "Save"}
            </Text>
          </Pressable>
        </View>

        <ScrollView className="flex-1">
          <View className="p-4">
            <View className="mb-6">
              <Text className="text-ink-muted text-sm font-medium mb-2">
                Amount
              </Text>
              <View className="flex-row items-center bg-surface-raised rounded-xl px-4">
                <Text className="text-white text-xl font-semibold mr-1">₹</Text>
                <TextInput
                  className="flex-1 text-white text-xl font-semibold py-4"
                  placeholder="0.00"
                  placeholderTextColor={colors.inkFaint}
                  keyboardType="decimal-pad"
                  value={amount}
                  onChangeText={setAmount}
                />
              </View>
            </View>

            <View className="mb-6">
              <Text className="text-ink-muted text-sm font-medium mb-2">
                Type
              </Text>
              <View className="flex-row gap-3">
                <Pressable
            accessibilityRole="radio"
                  accessibilityLabel="Credit given"
                  accessibilityState={{ checked: type === "credit" }}
                  className={`flex-1 flex-row items-center justify-center gap-2 py-3.5 rounded-xl border-2 ${
                    type === "credit"
                      ? "border-line bg-surface-raised"
                      : "border-transparent bg-surface-raised"
                  }`}
                  onPress={() => setType("credit")}
                >
                  <Ionicons
                    name="arrow-down-circle"
                    size={20}
                    color={type === "credit" ? colors.ink : colors.inkMuted}
                  />
                  <Text
                    className={`text-sm font-medium ${
                      type === "credit" ? "text-white" : "text-ink-muted"
                    }`}
                  >
                    Credit
                  </Text>
                </Pressable>

                <Pressable
            accessibilityRole="radio"
                  accessibilityLabel="Payment received"
                  accessibilityState={{ checked: type === "debit" }}
                  className={`flex-1 flex-row items-center justify-center gap-2 py-3.5 rounded-xl border-2 ${
                    type === "debit"
                      ? "border-line bg-surface-raised"
                      : "border-transparent bg-surface-raised"
                  }`}
                  onPress={() => setType("debit")}
                >
                  <Ionicons
                    name="arrow-up-circle"
                    size={20}
                    color={type === "debit" ? colors.positive : colors.inkMuted}
                  />
                  <Text
                    className={`text-sm font-medium ${
                      type === "debit" ? "text-white" : "text-ink-muted"
                    }`}
                  >
                    {type === "debit" ? "Payment" : "Debit"}
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* Payment method (persisted on update) */}
            <View className="mb-6">
              <PaymentMethodSelector
                value={paymentMethod}
                onChange={setPaymentMethod}
              />
            </View>

            <View className="mb-6">
              <Text className="text-ink-muted text-sm font-medium mb-2">
                Note (Optional)
              </Text>
              <TextInput
                className="bg-surface-raised rounded-xl p-4 text-ink text-sm min-h-[80px]"
                placeholder="Add a note..."
                placeholderTextColor={colors.inkFaint}
                value={note}
                onChangeText={setNote}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            {error ? (
              <Text accessibilityLiveRegion="polite" className="mt-3 text-danger-text text-sm">
                {error}
              </Text>
            ) : null}

            <View className="mt-8 pt-6 border-t border-line">
              <Pressable
            accessibilityRole="button"
                accessibilityLabel="Delete transaction"
                onPress={handleDelete}
              >
                <Ionicons name="trash-outline" size={20} color={colors.dangerText} />
                <Text className="text-red-500 text-sm font-medium">
                  Delete Transaction
                </Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}
