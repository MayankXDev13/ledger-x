import { StatusBar } from "expo-status-bar";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useState } from "react";
import { router } from "expo-router";
import { useOfflineQueue } from "@/hooks/useOfflineQueue";

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
      className="flex-1 bg-brand-dark"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View className="flex-1 px-6" style={{ paddingTop: insets.top + 16 }}>
        <Text className="text-3xl font-bold text-white mb-2">Add Customer</Text>
        <Text className="text-lg text-[#888888] mb-8">
          Enter customer details
        </Text>

        <View className="flex-1 gap-5">
          <View className="gap-2">
            <Text className="text-sm font-medium text-[#A0A0A0]">
              Customer Name
            </Text>
            <TextInput
              className="border border-[#3D3D3D] rounded-lg px-4 py-3.5 text-base text-white bg-[#2D2D2D]"
              placeholder="Full Name"
              placeholderTextColor="#666"
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
            <Text className="text-sm font-medium text-[#A0A0A0]">
              Phone Number
            </Text>
            <TextInput
              className="border border-[#3D3D3D] rounded-lg px-4 py-3.5 text-base text-white bg-[#2D2D2D]"
              placeholder="+91 99999 99999"
              placeholderTextColor="#666"
              value={phone}
              onChangeText={(text) => {
                setPhone(text);
                setPhoneError(null);
              }}
              keyboardType="phone-pad"
            />
            {phoneError && (
              <Text className="text-red-500 text-sm">{phoneError}</Text>
            )}
          </View>

          {error && <Text className="text-red-500 text-sm">{error}</Text>}

          {!isOnline && (
            <Text className="text-[#F59E0B] text-xs">
              Offline — saved on device and synced when you reconnect.
            </Text>
          )}

          <View className="flex-row gap-4 mt-4">
            <Pressable
              className="flex-1 py-4 rounded-lg items-center bg-[#2D2D2D]"
              onPress={() => router.back()}
            >
              <Text className="text-white text-base font-semibold">Cancel</Text>
            </Pressable>
            <Pressable
              className={`flex-1 py-4 rounded-lg items-center ${loading ? "opacity-60" : "bg-blue-500"}`}
              onPress={onSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text className="text-white text-base font-semibold">
                  Save Customer
                </Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>

      <StatusBar style="auto" />
    </KeyboardAvoidingView>
  );
}
