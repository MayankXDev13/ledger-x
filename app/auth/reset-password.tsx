import { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { supabase } from "@/lib/supabase";

type VerificationState =
  | { status: "verifying" }
  | { status: "verified" }
  | { status: "error"; message: string };

export default function ResetPasswordScreen() {
  const params = useLocalSearchParams();
  const tokenHash = params.token_hash;
  const type = params.type;

  const [verification, setVerification] = useState<VerificationState>({
    status: "verifying",
  });

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const [newPasswordError, setNewPasswordError] = useState<string | null>(null);
  const [confirmPasswordError, setConfirmPasswordError] = useState<
    string | null
  >(null);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      if (!tokenHash || typeof tokenHash !== "string") {
        setVerification({
          status: "error",
          message: "Missing reset token.",
        });
        return;
      }

      if (!type || typeof type !== "string") {
        setVerification({
          status: "error",
          message: "Missing reset type.",
        });
        return;
      }

      setVerification({ status: "verifying" });
      const { error } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: type as "recovery",
      });

      if (error) {
        setVerification({
          status: "error",
          message: error.message,
        });
        return;
      }

      setVerification({ status: "verified" });
    };

    void run();
  }, [tokenHash, type]);

  const validateForm = () => {
    let valid = true;
    setNewPasswordError(null);
    setConfirmPasswordError(null);
    setFormError(null);

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

  const onUpdate = async () => {
    if (verification.status !== "verified") return;
    if (!validateForm()) return;

    setLoading(true);
    setFormError(null);

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      setFormError(error.message);
      setLoading(false);
      return;
    }

    // After password reset, force the user to login with the new password.
    await supabase.auth.signOut();
    router.replace("/auth/login");
  };

  if (verification.status === "verifying") {
    return (
      <View className="flex-1 bg-brand-dark justify-center px-6">
        <View className="bg-brand-card border border-brand-border rounded-3xl p-7 shadow-sm shadow-brand-dark items-center">
          <ActivityIndicator color="#ffffff" />
          <Text className="text-brand-muted mt-4 font-medium">
            Verifying reset link...
          </Text>
        </View>
      </View>
    );
  }

  if (verification.status === "error") {
    return (
      <View className="flex-1 bg-brand-dark justify-center px-6">
        <View className="bg-brand-card border border-brand-border rounded-3xl p-7 shadow-sm shadow-brand-dark">
          <Text className="text-[26px] font-extrabold text-white mb-2">
            Reset Failed
          </Text>
          <Text className="text-[#EF4444] text-[14px] font-medium mb-6">
            {verification.message}
          </Text>

          <Pressable
            className="bg-brand-accent py-[18px] rounded-2xl items-center shadow-sm shadow-brand-accent/20 active:scale-95"
            onPress={() => router.replace("/auth/forgot-password")}
          >
            <Text className="text-brand-dark text-[18px] font-bold tracking-wide">
              Try Again
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-brand-dark justify-center px-6">
      <View className="bg-brand-card border border-brand-border rounded-3xl p-7 shadow-sm shadow-brand-dark">
        <Text className="text-[32px] font-extrabold text-white mb-2 tracking-tight">
          Reset Password
        </Text>
        <Text className="text-base text-brand-muted mb-8 font-medium">
          Choose a new password
        </Text>

        <View className="gap-5">
          <View className="gap-2">
            <Text className="text-[14px] text-brand-muted font-semibold ml-1">
              New Password
            </Text>
            <TextInput
              className="bg-brand-surface border border-brand-border rounded-2xl px-5 py-4 text-[16px] text-white"
              placeholder="••••••••"
              placeholderTextColor="#52525B"
              value={newPassword}
              onChangeText={(t) => {
                setNewPassword(t);
                setNewPasswordError(null);
                setFormError(null);
              }}
              secureTextEntry
            />
            {newPasswordError && (
              <Text className="text-[#EF4444] text-[13px] ml-1 font-medium">
                {newPasswordError}
              </Text>
            )}
          </View>

          <View className="gap-2">
            <Text className="text-[14px] text-brand-muted font-semibold ml-1">
              Confirm Password
            </Text>
            <TextInput
              className="bg-brand-surface border border-brand-border rounded-2xl px-5 py-4 text-[16px] text-white"
              placeholder="••••••••"
              placeholderTextColor="#52525B"
              value={confirmPassword}
              onChangeText={(t) => {
                setConfirmPassword(t);
                setConfirmPasswordError(null);
                setFormError(null);
              }}
              secureTextEntry
            />
            {confirmPasswordError && (
              <Text className="text-[#EF4444] text-[13px] ml-1 font-medium">
                {confirmPasswordError}
              </Text>
            )}
          </View>

          {formError && (
            <Text className="text-[#EF4444] text-[14px] font-medium text-center">
              {formError}
            </Text>
          )}

          <Pressable
            className={`bg-brand-accent py-[18px] rounded-2xl items-center shadow-sm shadow-brand-accent/20 ${
              loading ? "opacity-60" : "active:scale-95"
            }`}
            onPress={onUpdate}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#0A0A0A" />
            ) : (
              <Text className="text-brand-dark text-[18px] font-bold tracking-wide">
                Update Password
              </Text>
            )}
          </Pressable>

          <View className="flex-row justify-center mt-2 gap-2">
            <Text className="text-brand-muted text-[15px] font-medium">
              Back to login
            </Text>
            <Pressable
              onPress={() => router.replace("/auth/login")}
              className="active:opacity-70"
            >
              <Text className="text-brand-accent text-[15px] font-bold">
                Sign In
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}
