import { StatusBar } from "expo-status-bar";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useState } from "react";
import { router } from "expo-router";
import { useOfflineQueue } from "@/hooks/useOfflineQueue";
import { colors } from "@/lib/theme";
import { announce } from "@/lib/announce";

export default function AddCustomerScreen() {
  const insets = useSafeAreaInsets();
  const { queueCustomer, isOnline } = useOfflineQueue();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);

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
    } else {
      const digits = phone.replace(/\D/g, "");
      if (digits.length < 10 || digits.length > 12) {
        setPhoneError("Enter a valid phone number (10-12 digits)");
        valid = false;
      }
    }

    return valid;
  };

  const onSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setError(null);

    try {
      // Goes through the offline queue: online it lands immediately,
      // offline the device UUID keeps the retry idempotent.
      await queueCustomer({ name: name.trim(), phone: phone.trim() });
      announce("Customer added");
      router.back();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred",
      );
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-bg"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        className="flex-1"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: insets.top + 16,
          paddingBottom: insets.bottom + 32,
        }}
      >
        <Text className="text-3xl font-bold text-ink mb-2">Add Customer</Text>
        <Text className="text-lg text-ink-muted mb-8">
          Enter customer details
        </Text>

        <View className="flex-1 gap-5">
          <View className="gap-2">
            <Text className="text-sm font-medium text-ink-muted">
              Customer Name
            </Text>
            <TextInput
              className="border border-line rounded-xl px-4 py-3.5 text-base text-ink bg-surface-raised"
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
            {nameError && (
              <Text className="text-red-500 text-sm">{nameError}</Text>
            )}
          </View>

          <View className="gap-2">
            <Text className="text-sm font-medium text-ink-muted">
              Phone Number
            </Text>
            <TextInput
              className="border border-line rounded-xl px-4 py-3.5 text-base text-ink bg-surface-raised"
              placeholder="+91 99999 99999"
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
            {phoneError && (
              <Text className="text-red-500 text-sm">{phoneError}</Text>
            )}
          </View>

          {error && <Text className="text-red-500 text-sm">{error}</Text>}

          {!isOnline && (
            <Text className="text-ink-muted text-xs">
              Offline — saved on device and synced when you reconnect.
            </Text>
          )}

          <View className="flex-row gap-4 mt-4">
            <Pressable
            accessibilityRole="button"
              accessibilityLabel="Cancel"
              className="flex-1 py-4 rounded-xl items-center bg-surface-raised"
              onPress={() => router.back()}
            >
              <Text className="text-white text-base font-semibold">Cancel</Text>
            </Pressable>
            <Pressable
            accessibilityRole="button"
              accessibilityLabel="Save customer"
              accessibilityState={{ disabled: loading, busy: loading }}
              className={`flex-1 py-4 rounded-xl items-center ${loading ? "opacity-60" : "bg-brand-primary-fill"}`}
              onPress={onSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={colors.ink} />
              ) : (
                <Text className="text-white text-base font-semibold">
                  Save Customer
                </Text>
              )}
            </Pressable>
          </View>
        </View>
      </ScrollView>

      <StatusBar style="light" />
    </KeyboardAvoidingView>
  );
}
