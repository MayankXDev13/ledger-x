import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import * as ExpoLinking from "expo-linking";
import { supabase } from "@/lib/supabase";

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const validateEmail = () => {
    if (!email) return "Email is required";
    if (!/^\S+@\S+\.\S+$/.test(email)) return "Invalid email address";
    return null;
  };

  const onSend = async () => {
    const emailError = validateEmail();
    if (emailError) {
      setError(emailError);
      return;
    }

    setLoading(true);
    setError(null);

    const redirectTo = ExpoLinking.createURL("/auth/reset-password");

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email,
      { redirectTo },
    );

    if (resetError) {
      setError(resetError.message);
      setLoading(false);
      return;
    }

    setSent(true);
    setLoading(false);
  };

  return (
    <View className="flex-1 bg-brand-dark justify-center px-6">
      <View className="bg-brand-card border border-brand-border rounded-3xl p-7 shadow-sm shadow-brand-dark">
        <Text className="text-[32px] font-extrabold text-white mb-2 tracking-tight">
          Forgot Password
        </Text>
        <Text className="text-base text-brand-muted mb-8 font-medium">
          Enter your email and we’ll send a reset link
        </Text>

        <View className="gap-5">
          <View className="gap-2">
            <Text className="text-[14px] text-brand-muted font-semibold ml-1">
              Email
            </Text>
            <TextInput
              className="bg-brand-surface border border-brand-border rounded-2xl px-5 py-4 text-[16px] text-white"
              placeholder="name@company.com"
              placeholderTextColor="#52525B"
              value={email}
              onChangeText={(t) => {
                setEmail(t);
                setError(null);
              }}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          {error && (
            <Text className="text-[#EF4444] text-[14px] font-medium text-center">
              {error}
            </Text>
          )}

          {sent && !error ? (
            <Text className="text-brand-muted text-[14px] font-medium text-center">
              Check your email for the reset link.
            </Text>
          ) : null}

          <Pressable
            className={`bg-brand-accent py-[18px] rounded-2xl items-center shadow-sm shadow-brand-accent/20 ${
              loading ? "opacity-60" : "active:scale-95"
            }`}
            onPress={onSend}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#0A0A0A" />
            ) : (
              <Text className="text-brand-dark text-[18px] font-bold tracking-wide">
                {sent ? "Resend Email" : "Send Reset Link"}
              </Text>
            )}
          </Pressable>

          <View className="flex-row justify-center mt-2 gap-2">
            <Text className="text-brand-muted text-[15px] font-medium">
              Remembered it?
            </Text>
            <Pressable
              onPress={() => router.push("/auth/login")}
              className="active:opacity-70"
            >
              <Text className="text-brand-accent text-[15px] font-bold">
                Back to Login
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}
