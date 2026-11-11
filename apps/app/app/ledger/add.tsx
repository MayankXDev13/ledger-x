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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PaymentMethodSelector } from "@/components/PaymentMethodSelector";
import { useOfflineQueue } from "@/hooks/useOfflineQueue";
import type { PaymentMethod } from "@/lib/api";
import { parseWholeRupeAmount } from "@/lib/amount";
import { colors } from "@/lib/theme";
import { announce } from "@/lib/announce";

export default function AddEntryScreen() {
  const insets = useSafeAreaInsets();
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

  const onSubmit = async () => {
    // The ledger stores whole rupees, so a fractional amount is refused here
    // rather than being queued for a server that would reject it.
    const parsed = parseWholeRupeAmount(amount);
    setAmountError(parsed.ok ? null : parsed.error);
    if (!contactId || !parsed.ok) return;

    setLoading(true);
    setError(null);

    try {
      await queueTransaction({
        customerId: contactId,
        amount: parsed.amount,
        type: entryType,
        paymentMethod,
        note: note || undefined,
      });
      announce(entryType === "credit" ? "Credit added to the ledger" : "Payment recorded");
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
      <ScrollView
        style={styles.content}
        bounces={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingTop: insets.top + 16,
          paddingBottom: insets.bottom + 32,
        }}
      >
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
              placeholder="0"
              accessibilityLabel="Amount in rupees"
              keyboardType="decimal-pad"
              placeholderTextColor={colors.inkFaint}
              value={amount}
              onChangeText={(text) => {
                setAmount(text);
                setAmountError(null);
              }}
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
              placeholderTextColor={colors.inkFaint}
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
            accessibilityRole="button"
              style={[styles.button, styles.cancelButton]}
              onPress={() => router.back()}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
            <Pressable
            accessibilityRole="button"
              style={[
                styles.button,
                styles.saveButton,
                loading && styles.buttonDisabled,
              ]}
              onPress={onSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={colors.ink} />
              ) : (
                <Text style={styles.buttonText}>Save Entry</Text>
              )}
            </Pressable>
          </View>
        </View>
      </ScrollView>

      <StatusBar style="light" />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: colors.ink,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: colors.inkMuted,
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
    color: colors.inkMuted,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.ink,
    backgroundColor: colors.surface,
  },
  noteInput: {
    minHeight: 80,
  },
  errorText: {
    color: colors.dangerText,
    fontSize: 14,
  },
  offlineText: {
    color: colors.brand,
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
    borderRadius: 12,
    alignItems: "center",
  },
  saveButton: {
    backgroundColor: colors.brandFill,
  },
  cancelButton: {
    backgroundColor: colors.surface,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: "600",
  },
  cancelButtonText: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: "600",
  },
});
