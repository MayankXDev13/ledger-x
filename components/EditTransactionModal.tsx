import React, { useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  TextInput,
  Modal,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LedgerEntry, TransactionType } from "@/types/database";

interface EditTransactionModalProps {
  visible: boolean;
  transaction: LedgerEntry | null;
  onClose: () => void;
  onSave: (
    entryId: string,
    amount: number,
    type: TransactionType,
    note: string,
    createdAt: string,
  ) => void;
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
  const [type, setType] = useState<TransactionType>("credit");
  const [note, setNote] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  React.useEffect(() => {
    if (transaction) {
      setAmount(transaction.amount.toString());
      setType(transaction.type as TransactionType);
      setNote(transaction.note || "");
    }
  }, [transaction]);

  const handleSave = () => {
    if (!transaction) return;
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) return;

    onSave(
      transaction.id,
      amountNum,
      type,
      note.trim(),
      transaction.created_at,
    );
    onClose();
  };

  const handleDelete = () => {
    if (!transaction) return;
    onDelete(transaction.id);
    onClose();
    setShowDeleteConfirm(false);
  };

  if (!transaction) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={onClose}>
            <Ionicons name="close" size={24} color="#FFFFFF" />
          </Pressable>
          <Text style={styles.headerTitle}>Edit Transaction</Text>
          <Pressable onPress={handleSave}>
            <Text style={styles.saveButton}>Save</Text>
          </Pressable>
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
        >
          <View style={styles.amountSection}>
            <Text style={styles.label}>Amount</Text>
            <View style={styles.amountInputContainer}>
              <Text style={styles.currencySymbol}>₹</Text>
              <TextInput
                style={styles.amountInput}
                placeholder="0.00"
                placeholderTextColor="#666"
                keyboardType="decimal-pad"
                value={amount}
                onChangeText={setAmount}
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Type</Text>
            <View style={styles.typeToggle}>
              <Pressable
                style={[
                  styles.typeButton,
                  type === "credit" && styles.typeButtonSelected,
                ]}
                onPress={() => setType("credit")}
              >
                <Ionicons
                  name="arrow-down-circle"
                  size={20}
                  color={type === "credit" ? "#10B981" : "#666"}
                />
                <Text
                  style={[
                    styles.typeButtonText,
                    type === "credit" && styles.typeButtonTextSelected,
                  ]}
                >
                  Credit
                </Text>
              </Pressable>

              <Pressable
                style={[
                  styles.typeButton,
                  type === "debit" && styles.typeButtonSelected,
                ]}
                onPress={() => setType("debit")}
              >
                <Ionicons
                  name="arrow-up-circle"
                  size={20}
                  color={type === "debit" ? "#EF4444" : "#666"}
                />
                <Text
                  style={[
                    styles.typeButtonText,
                    type === "debit" && styles.typeButtonTextSelected,
                  ]}
                >
                  Debit
                </Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Note (Optional)</Text>
            <TextInput
              style={styles.noteInput}
              placeholder="Add a note..."
              placeholderTextColor="#666"
              value={note}
              onChangeText={setNote}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.deleteSection}>
            <Pressable
              style={styles.deleteButton}
              onPress={() => setShowDeleteConfirm(true)}
            >
              <Ionicons name="trash-outline" size={20} color="#EF4444" />
              <Text style={styles.deleteButtonText}>Delete Transaction</Text>
            </Pressable>
          </View>
        </ScrollView>

        <Modal
          transparent
          visible={showDeleteConfirm}
          animationType="fade"
          onRequestClose={() => setShowDeleteConfirm(false)}
        >
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setShowDeleteConfirm(false)}
          >
            <View style={styles.modalContent}>
              <Ionicons
                name="warning-outline"
                size={48}
                color="#EF4444"
                style={{ alignSelf: "center", marginBottom: 16 }}
              />
              <Text style={styles.modalTitle}>Delete Transaction?</Text>
              <Text style={styles.modalMessage}>
                This will permanently delete this transaction. The customer's
                balance will be updated accordingly.
              </Text>
              <View style={styles.modalButtons}>
                <Pressable
                  style={styles.modalCancelButton}
                  onPress={() => setShowDeleteConfirm(false)}
                >
                  <Text style={styles.modalCancelButtonText}>Cancel</Text>
                </Pressable>
                <Pressable
                  style={styles.modalDeleteButton}
                  onPress={handleDelete}
                >
                  <Text style={styles.modalDeleteButtonText}>Delete</Text>
                </Pressable>
              </View>
            </View>
          </Pressable>
        </Modal>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1A1A1A",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#2D2D2D",
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
  },
  saveButton: {
    color: "#3B82F6",
    fontSize: 16,
    fontWeight: "600",
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  amountSection: {
    marginBottom: 24,
  },
  label: {
    color: "#A0A0A0",
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 8,
  },
  amountInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2D2D2D",
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  currencySymbol: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "600",
    marginRight: 4,
  },
  amountInput: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "600",
    paddingVertical: 16,
  },
  section: {
    marginBottom: 24,
  },
  typeToggle: {
    flexDirection: "row",
    gap: 12,
  },
  typeButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#2D2D2D",
    borderWidth: 2,
    borderColor: "transparent",
  },
  typeButtonSelected: {
    borderColor: "#3D3D3D",
    backgroundColor: "#3D3D3D",
  },
  typeButtonText: {
    color: "#666",
    fontSize: 15,
    fontWeight: "500",
  },
  typeButtonTextSelected: {
    color: "#FFFFFF",
  },
  noteInput: {
    backgroundColor: "#2D2D2D",
    borderRadius: 12,
    padding: 16,
    color: "#FFFFFF",
    fontSize: 15,
    minHeight: 80,
  },
  deleteSection: {
    marginTop: 32,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: "#2D2D2D",
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
  },
  deleteButtonText: {
    color: "#EF4444",
    fontSize: 15,
    fontWeight: "500",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#2D2D2D",
    borderRadius: 16,
    padding: 24,
    width: "85%",
    maxWidth: 360,
  },
  modalTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 12,
    textAlign: "center",
  },
  modalMessage: {
    color: "#A0A0A0",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: "#3D3D3D",
    alignItems: "center",
  },
  modalCancelButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "500",
  },
  modalDeleteButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: "#EF4444",
    alignItems: "center",
  },
  modalDeleteButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
});
