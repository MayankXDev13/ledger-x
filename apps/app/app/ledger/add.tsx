import { StatusBar } from "expo-status-bar";
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useState } from "react";
import { useLocalSearchParams, router } from "expo-router";
import { PaymentMethodSelector } from "@/components/PaymentMethodSelector";
import { useOfflineQueue } from "@/hooks/useOfflineQueue";
import type { PaymentMethod } from "@/lib/api";

export default function AddEntryScreen() {
  const { contactId, type } = useLocalSearchParams<{
    contactId: string;
    type: string;
  }>();
  const { queueTransaction, isOnline } = useOfflineQueue();
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [amountError, setAmountError] = useState<string | null>(null);

  const entryType = type === "debit" ? "debit" : "credit";

  const validateForm = () => {
    let valid = true;
    setAmountError(null);

    if (!amount) {
      setAmountError("Amount is required");
      valid = false;
    } else {
      const numAmount = parseFloat(amount);
      if (isNaN(numAmount) || numAmount <= 0) {
        setAmountError("Please enter a valid amount");
        valid = false;
      }
    }

    return valid;
  };

  const onSubmit = async () => {
    if (!contactId || !validateForm()) return;

    setLoading(true);
    setError(null);

    try {
      await queueTransaction({
        customerId: contactId,
        amount: parseFloat(amount),
        type: entryType,
        paymentMethod,
        note: note || undefined,
      });
      router.back();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save entry");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView style={styles.content} bounces={false}>
        <Text style={styles.title}>
          {entryType === "credit" ? "Add Credit" : "Record Payment"}
        </Text>
        <Text style={styles.subtitle}>
          {entryType === "credit"
            ? "Money you gave"
            : "Money the customer paid you"}
        </Text>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Amount (₹)</Text>
            <TextInput
              style={styles.input}
              placeholder="0.00"
              placeholderTextColor="#999999"
              value={amount}
              onChangeText={(text) => {
                setAmount(text);
                setAmountError(null);
              }}
              keyboardType="decimal-pad"
            />
            {amountError && <Text style={styles.errorText}>{amountError}</Text>}
          </View>

          <View style={styles.inputGroup}>
            <PaymentMethodSelector
              value={paymentMethod}
              onChange={setPaymentMethod}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Note (Optional)</Text>
            <TextInput
              style={[styles.input, styles.noteInput]}
              placeholder="Add a note..."
              placeholderTextColor="#999999"
              value={note}
              onChangeText={setNote}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          {!isOnline && (
            <Text style={styles.offlineText}>
              Offline — saved on device and synced when you reconnect.
            </Text>
          )}

          {error && <Text style={styles.errorText}>{error}</Text>}

          <View style={styles.buttonContainer}>
            <Pressable
              style={[styles.button, styles.cancelButton]}
              onPress={() => router.back()}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[
                styles.button,
                styles.saveButton,
                loading && styles.buttonDisabled,
              ]}
              onPress={onSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.buttonText}>Save Entry</Text>
              )}
            </Pressable>
          </View>
        </View>
      </ScrollView>

      <StatusBar style="auto" />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0A0A0A",
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: "#888888",
    marginBottom: 32,
  },
  form: {
    gap: 24,
    paddingBottom: 40,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#cccccc",
  },
  input: {
    borderWidth: 1,
    borderColor: "#333333",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: "#ffffff",
    backgroundColor: "#171717",
  },
  noteInput: {
    minHeight: 80,
  },
  errorText: {
    color: "#ff6b6b",
    fontSize: 14,
  },
  offlineText: {
    color: "#F59E0B",
    fontSize: 13,
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 16,
    marginTop: 16,
  },
  button: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  saveButton: {
    backgroundColor: "#ffffff",
  },
  cancelButton: {
    backgroundColor: "#171717",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#000000",
    fontSize: 16,
    fontWeight: "600",
  },
  cancelButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
});
