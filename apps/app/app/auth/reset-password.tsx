import { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import * as Linking from "expo-linking";
import { useLinkingURL } from "expo-linking";
import { supabase } from "@/lib/supabase";

type VerificationState =
  | { status: "verifying" }
  | { status: "verified" }
  | { status: "error"; message: string };

export default function ResetPasswordScreen() {
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

  const linkingUrl = useLinkingURL();

  useEffect(() => {
    const handleSession = async () => {
      try {
        const url = linkingUrl;

        if (!url) {
          setVerification({
            status: "error",
            message: "Invalid or missing reset link.",
          });
          return;
        }

        const parsed = Linking.parse(url);

        const access_token = parsed.queryParams?.access_token as string;
        const refresh_token = parsed.queryParams?.refresh_token as string;

        if (!access_token || !refresh_token) {
          setVerification({
            status: "error",
            message: "Reset link is invalid or expired.",
          });
          return;
        }

        const { error } = await supabase.auth.setSession({
          access_token,
          refresh_token,
        });

        if (error) {
          setVerification({
            status: "error",
            message: error.message,
          });
          return;
        }

        setVerification({ status: "verified" });
      } catch (err: any) {
        setVerification({
          status: "error",
          message: err.message || "Something went wrong.",
        });
      }
    };

    handleSession();
  }, [linkingUrl]);

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

    const { data: sessionData, error: sessionError } =
      await supabase.auth.getSession();

    if (sessionError || !sessionData.session) {
      setFormError(sessionError?.message ?? "Your reset link has expired.");
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      setFormError(error.message);
      setLoading(false);
      return;
    }

    await supabase.auth.signOut();
    router.replace("/auth/login");
  };

  if (verification.status === "verifying") {
    return (
      <View className="flex-1 bg-brand-dark justify-center px-6">
        <View className="bg-brand-card border border-brand-border rounded-3xl p-7 items-center">
          <ActivityIndicator color="#ffffff" />
          <Text className="text-brand-muted mt-4">Verifying reset link...</Text>
        </View>
      </View>
    );
  }

  if (verification.status === "error") {
    return (
      <View className="flex-1 bg-brand-dark justify-center px-6">
        <View className="bg-brand-card border border-brand-border rounded-3xl p-7">
          <Text className="text-[26px] font-bold text-white mb-2">
            Reset Failed
          </Text>
          <Text className="text-red-500 mb-6">{verification.message}</Text>

          <Pressable
            className="bg-brand-accent py-4 rounded-2xl items-center"
            onPress={() => router.replace("/auth/forgot-password")}
          >
            <Text className="text-black font-bold">Try Again</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-brand-dark justify-center px-6">
      <View className="bg-brand-card border border-brand-border rounded-3xl p-7">
        <Text className="text-2xl font-bold text-white mb-2">
          Reset Password
        </Text>

        <View className="gap-4 mt-4">
          <TextInput
            placeholder="New Password"
            placeholderTextColor="#999"
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
            className="bg-brand-surface p-4 rounded-xl text-white"
          />
          {newPasswordError && (
            <Text className="text-red-500">{newPasswordError}</Text>
          )}

          <TextInput
            placeholder="Confirm Password"
            placeholderTextColor="#999"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            className="bg-brand-surface p-4 rounded-xl text-white"
          />
          {confirmPasswordError && (
            <Text className="text-red-500">{confirmPasswordError}</Text>
          )}

          {formError && (
            <Text className="text-red-500 text-center">{formError}</Text>
          )}

          <Pressable
            onPress={onUpdate}
            disabled={loading}
            className="bg-brand-accent py-4 rounded-xl items-center mt-4"
          >
            {loading ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text className="text-black font-bold">Update Password</Text>
            )}
          </Pressable>
        </View>
      </View>
    </View>
  );
}
