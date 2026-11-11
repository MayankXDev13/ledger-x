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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useState, useEffect } from "react";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { customersApi } from "@/lib/api";
import { DeleteConfirmationDialog } from "@/components/DeleteConfirmationDialog";
import { colors } from "@/lib/theme";
import { announce } from "@/lib/announce";

export default function EditCustomerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (id) {
      fetchCustomer();
    }
  }, [id]);

  const fetchCustomer = async () => {
    if (!id) return;

    setLoading(true);
    try {
      const customer = await customersApi.get(id);
      setName(customer.name);
      setPhone(customer.phone);
    } catch {
      setError("Failed to load customer");
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    let valid = true;
    setNameError(null);
    setPhoneError(null);

    if (!name.trim()) {
      setNameError("Name is required");
      valid = false;
    }

    if (!phone.trim()) {
      setPhoneError("Phone number is required");
      valid = false;
    } else if (phone.replace(/\D/g, "").length < 10) {
      setPhoneError("Valid phone number required");
      valid = false;
    }

    return valid;
  };

  const onSave = async () => {
    if (!validateForm()) return;

    setSaving(true);
    setError(null);

    try {
      await customersApi.update(id, {
        name: name.trim(),
        phone: phone.trim(),
      });
      announce("Customer updated");
      router.back();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred",
      );
      setSaving(false);
    }
  };

  const handleDeleteCustomer = async () => {
    if (!id) return;

    try {
      await customersApi.remove(id);
      router.replace("/(tabs)/customers");
    } catch (err) {
      console.error("Error deleting customer:", err);
      setError("Failed to delete customer");
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.ink} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        style={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
      >
        <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            hitSlop={12}
            style={{ minWidth: 44, minHeight: 44, justifyContent: "center", alignItems: "center" }}
            onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.ink} />
          </Pressable>
          <Text style={styles.headerTitle}>Edit Customer</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Customer Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Full Name"
              accessibilityLabel="Customer name"
              autoCapitalize="words"
              placeholderTextColor={colors.inkFaint}
              value={name}
              onChangeText={(text) => {
                setName(text);
                setNameError(null);
              }}
            />
            {nameError && <Text style={styles.errorText}>{nameError}</Text>}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={styles.input}
              placeholder="+91 98765 43210"
              placeholderTextColor={colors.inkFaint}
              value={phone}
              onChangeText={(text) => {
                setPhone(text);
                setPhoneError(null);
              }}
              keyboardType="phone-pad"
              autoComplete="tel"
              textContentType="telephoneNumber"
              accessibilityLabel="Phone number"
            />
            {phoneError && <Text style={styles.errorText}>{phoneError}</Text>}
          </View>

          {error && <Text style={styles.errorText}>{error}</Text>}

          <View style={styles.buttonContainer}>
            <Pressable
            accessibilityRole="button"
              accessibilityLabel="Save changes"
              accessibilityState={{ disabled: saving, busy: saving }}
              style={[
                styles.button,
                styles.saveButton,
                saving && styles.buttonDisabled,
              ]}
              onPress={onSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color={colors.ink} />
              ) : (
                <Text style={styles.buttonText}>Save Changes</Text>
              )}
            </Pressable>
          </View>

          <View style={styles.deleteSection}>
            <Pressable
            accessibilityRole="button"
              style={styles.deleteButton}
              onPress={() => setShowDeleteConfirm(true)}
            >
              <Ionicons name="trash-outline" size={20} color={colors.dangerText} />
              <Text style={styles.deleteButtonText}>Delete Customer</Text>
            </Pressable>
            <Text style={styles.deleteWarning}>
              This will delete all transactions and remove this customer.
            </Text>
          </View>
        </View>
      </ScrollView>

      <DeleteConfirmationDialog
        visible={showDeleteConfirm}
        title="Delete Customer?"
        message="This will permanently delete this customer and all their transactions. This action cannot be undone."
        confirmText="Delete"
        onConfirm={handleDeleteCustomer}
        onCancel={() => setShowDeleteConfirm(false)}
      />

      <StatusBar style="light" />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scrollContent: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.ink,
  },
  form: {
    paddingHorizontal: 20,
    gap: 20,
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
    backgroundColor: colors.surfaceRaised,
  },
  errorText: {
    color: colors.dangerText,
    fontSize: 14,
  },
  buttonContainer: {
    marginTop: 8,
  },
  button: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  saveButton: {
    backgroundColor: colors.brandFill,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: "600",
  },
  deleteSection: {
    marginTop: 32,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    alignItems: "center",
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
  },
  deleteButtonText: {
    color: colors.dangerText,
    fontSize: 15,
    fontWeight: "500",
  },
  deleteWarning: {
    color: colors.inkMuted,
    fontSize: 12,
    marginTop: 8,
    textAlign: "center",
  },
});
