import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  TextInput,
  Modal,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { PaymentMethodSelector } from "@/components/PaymentMethodSelector";
import type { PaymentMethod, Transaction } from "@/lib/api";

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
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) return;

    setSaving(true);
    try {
      await onSave(
        transaction.id,
        amountNum,
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
      <View className="flex-1 bg-[#1A1A1A]">
        <View className="flex-row justify-between items-center px-4 py-4 border-b border-[#2D2D2D]">
          <Pressable onPress={onClose}>
            <Ionicons name="close" size={24} color="#FFFFFF" />
          </Pressable>
          <Text className="text-white text-lg font-semibold">
            Edit Transaction
          </Text>
          <Pressable onPress={handleSave} disabled={saving}>
            <Text className="text-blue-500 text-base font-semibold">
              {saving ? "Saving…" : "Save"}
            </Text>
          </Pressable>
        </View>

        <ScrollView className="flex-1">
          <View className="p-4">
            <View className="mb-6">
              <Text className="text-[#A0A0A0] text-sm font-medium mb-2">
                Amount
              </Text>
              <View className="flex-row items-center bg-[#2D2D2D] rounded-xl px-4">
                <Text className="text-white text-xl font-semibold mr-1">₹</Text>
                <TextInput
                  className="flex-1 text-white text-xl font-semibold py-4"
                  placeholder="0.00"
                  placeholderTextColor="#666"
                  keyboardType="decimal-pad"
                  value={amount}
                  onChangeText={setAmount}
                />
              </View>
            </View>

            <View className="mb-6">
              <Text className="text-[#A0A0A0] text-sm font-medium mb-2">
                Type
              </Text>
              <View className="flex-row gap-3">
                <Pressable
                  className={`flex-1 flex-row items-center justify-center gap-2 py-3.5 rounded-xl border-2 ${
                    type === "credit"
                      ? "border-[#3D3D3D] bg-[#3D3D3D]"
                      : "border-transparent bg-[#2D2D2D]"
                  }`}
                  onPress={() => setType("credit")}
                >
                  <Ionicons
                    name="arrow-down-circle"
                    size={20}
                    color={type === "credit" ? "#10B981" : "#666"}
                  />
                  <Text
                    className={`text-sm font-medium ${
                      type === "credit" ? "text-white" : "text-[#666]"
                    }`}
                  >
                    Credit
                  </Text>
                </Pressable>

                <Pressable
                  className={`flex-1 flex-row items-center justify-center gap-2 py-3.5 rounded-xl border-2 ${
                    type === "debit"
                      ? "border-[#3D3D3D] bg-[#3D3D3D]"
                      : "border-transparent bg-[#2D2D2D]"
                  }`}
                  onPress={() => setType("debit")}
                >
                  <Ionicons
                    name="arrow-up-circle"
                    size={20}
                    color={type === "debit" ? "#EF4444" : "#666"}
                  />
                  <Text
                    className={`text-sm font-medium ${
                      type === "debit" ? "text-white" : "text-[#666]"
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
              <Text className="text-[#A0A0A0] text-sm font-medium mb-2">
                Note (Optional)
              </Text>
              <TextInput
                className="bg-[#2D2D2D] rounded-xl p-4 text-white text-sm min-[80px]"
                placeholder="Add a note..."
                placeholderTextColor="#666"
                value={note}
                onChangeText={setNote}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            <View className="mt-8 pt-6 border-t border-[#2D2D2D]">
              <Pressable
                className="flex-row items-center justify-center gap-2 py-3"
                onPress={handleDelete}
              >
                <Ionicons name="trash-outline" size={20} color="#EF4444" />
                <Text className="text-red-500 text-sm font-medium">
                  Delete Transaction
                </Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}
