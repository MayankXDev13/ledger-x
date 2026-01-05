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
} from "react-native";
import { useState } from "react";
import { useLocalSearchParams, router } from "expo-router";
import { supabase } from "@/lib/supabase";

export default function AddEntryScreen() {
  const { contactId, type } = useLocalSearchParams<{
    contactId: string;
    type: string;
  }>();
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [amountError, setAmountError] = useState<string | null>(null);

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

    const numAmount = parseFloat(amount);

    const { error: insertError } = await supabase
      .from("ledger_entries")
      .insert({
        contact_id: contactId,
        amount: numAmount,
        type: type as "credit" | "debit",
        note: note || null,
      });

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return;
    }

    router.back();
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.content}>
        <Text style={styles.title}>
          {type === "credit" ? "Add Credit" : "Add Debit"}
        </Text>
        <Text style={styles.subtitle}>
          {type === "credit" ? "Money you gave" : "Money you received"}
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
      </View>
      <StatusBar style="auto" />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a1a",
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
    flex: 1,
    gap: 24,
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
    backgroundColor: "#2a2a2a",
  },
  noteInput: {
    minHeight: 80,
  },
  errorText: {
    color: "#ff6b6b",
    fontSize: 14,
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
    backgroundColor: "#2a2a2a",
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
