import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { changePassword, getSessionUser } from "@/lib/auth-session";
import { useAuth } from "@/hooks/useAuth";

export default function UpdatePasswordScreen() {
  useAuth();
  const insets = useSafeAreaInsets();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPasswordError, setCurrentPasswordError] = useState<
    string | null
  >(null);
  const [newPasswordError, setNewPasswordError] = useState<string | null>(null);
  const [confirmPasswordError, setConfirmPasswordError] = useState<
    string | null
  >(null);

  const validateForm = () => {
    let valid = true;
    setCurrentPasswordError(null);
    setNewPasswordError(null);
    setConfirmPasswordError(null);
    setError(null);

    if (!currentPassword) {
      setCurrentPasswordError("Current password is required");
      valid = false;
    }

    if (!newPassword) {
      setNewPasswordError("New password is required");
      valid = false;
    } else if (newPassword.length < 6) {
      setNewPasswordError("Password must be at least 6 characters");
      valid = false;
    }

    if (newPassword !== confirmPassword) {
      setConfirmPasswordError("Passwords do not match");
      valid = false;
    }

    return valid;
  };

  const onSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setError(null);

    try {
      await changePassword(currentPassword, newPassword);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Password change failed";
      if (message.toLowerCase().includes("current password")) {
        setCurrentPasswordError("Current password is incorrect");
      } else {
        setError(message);
      }
      setLoading(false);
      return;
    }

    router.replace("/auth/login");
  };

  return (
    <View className="flex-1 bg-brand-dark">
      <View className="flex-1 px-6" style={{ paddingTop: insets.top + 16 }}>
        <Text className="text-3xl font-bold text-white mb-2">
          Change Password
        </Text>
        <Text className="text-base text-[#888888] mb-8">
          Enter your current password and new password
        </Text>

        <View className="flex-1 gap-5">
          <View className="gap-2">
            <Text className="text-sm font-medium text-[#cccccc]">
              Current Password
            </Text>
            <TextInput
              className="border border-brand-border rounded-lg px-4 py-3.5 text-base text-white bg-brand-card"
              placeholder="Enter current password"
              placeholderTextColor="#666666"
              value={currentPassword}
              onChangeText={(text) => {
                setCurrentPassword(text);
                setCurrentPasswordError(null);
              }}
              secureTextEntry
            />
            {currentPasswordError && (
              <Text className="text-[#ff6b6b] text-sm">
                {currentPasswordError}
              </Text>
            )}
          </View>

          <View className="gap-2">
            <Text className="text-sm font-medium text-[#cccccc]">
              New Password
            </Text>
            <TextInput
              className="border border-brand-border rounded-lg px-4 py-3.5 text-base text-white bg-brand-card"
              placeholder="Enter new password"
              placeholderTextColor="#666666"
              value={newPassword}
              onChangeText={(text) => {
                setNewPassword(text);
                setNewPasswordError(null);
              }}
              secureTextEntry
            />
            {newPasswordError && (
              <Text className="text-[#ff6b6b] text-sm">{newPasswordError}</Text>
            )}
          </View>

          <View className="gap-2">
            <Text className="text-sm font-medium text-[#cccccc]">
              Confirm New Password
            </Text>
            <TextInput
              className="border border-brand-border rounded-lg px-4 py-3.5 text-base text-white bg-brand-card"
              placeholder="Confirm new password"
              placeholderTextColor="#666666"
              value={confirmPassword}
              onChangeText={(text) => {
                setConfirmPassword(text);
                setConfirmPasswordError(null);
              }}
              secureTextEntry
            />
            {confirmPasswordError && (
              <Text className="text-[#ff6b6b] text-sm">
                {confirmPasswordError}
              </Text>
            )}
          </View>

          {error && <Text className="text-[#ff6b6b] text-sm">{error}</Text>}

          <Pressable
            className={`bg-white py-4 rounded-lg items-center mt-4 ${loading ? "opacity-60" : ""}`}
            onPress={onSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#000000" />
            ) : (
              <Text className="text-black text-base font-semibold">
                Update Password
              </Text>
            )}
          </Pressable>
        </View>
      </View>
    </View>
  );
}
