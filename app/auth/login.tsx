import { StatusBar } from "expo-status-bar";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { useState } from "react";
import { router } from "expo-router";
import { supabase } from "@/lib/supabase";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const validateForm = () => {
    let valid = true;
    setEmailError(null);
    setPasswordError(null);

    if (!email) {
      setEmailError("Email is required");
      valid = false;
    } else if (!/^\\S+@\\S+\\.\\S+$/.test(email)) {
      setEmailError("Invalid email address");
      valid = false;
    }

    if (!password) {
      setPasswordError("Password is required");
      valid = false;
    } else if (password.length < 6) {
      setPasswordError("Password must be at least 6 characters");
      valid = false;
    }

    return valid;
  };

  const onSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setError(null);

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    router.replace("/home");
    setLoading(false);
  };

  return (
    <View className="flex-1 bg-brand-dark justify-center px-6">
      <View className="bg-brand-card border border-brand-border rounded-3xl p-7 shadow-sm shadow-brand-dark">
        <Text className="text-[32px] font-extrabold text-white mb-2 tracking-tight">
          Welcome Back
        </Text>
        <Text className="text-base text-brand-muted mb-8 font-medium">
          Sign in to your ledger
        </Text>

        <View className="gap-5">
          <View className="gap-2">
            <Text className="text-[14px] text-brand-muted font-semibold ml-1">Email</Text>
            <TextInput
              className="bg-brand-surface border border-brand-border rounded-2xl px-5 py-4 text-[16px] text-white"
              placeholder="name@company.com"
              placeholderTextColor="#52525B"
              value={email}
              onChangeText={(t) => {
                setEmail(t);
                setEmailError(null);
              }}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            {emailError && (
              <Text className="text-[#EF4444] text-[13px] ml-1 font-medium">{emailError}</Text>
            )}
          </View>

          <View className="gap-2">
            <Text className="text-[14px] text-brand-muted font-semibold ml-1">
              Password
            </Text>
            <TextInput
              className="bg-brand-surface border border-brand-border rounded-2xl px-5 py-4 text-[16px] text-white"
              placeholder="••••••••"
              placeholderTextColor="#52525B"
              value={password}
              onChangeText={(t) => {
                setPassword(t);
                setPasswordError(null);
              }}
              secureTextEntry
            />
            {passwordError && (
              <Text className="text-[#EF4444] text-[13px] ml-1 font-medium">{passwordError}</Text>
            )}
          </View>

          {error && <Text className="text-[#EF4444] text-[14px] font-medium text-center">{error}</Text>}

          <Pressable
            className={`bg-brand-accent py-[18px] rounded-2xl items-center mt-3 shadow-sm shadow-brand-accent/20 ${loading ? "opacity-60" : "active:scale-95"}`}
            onPress={onSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#0A0A0A" />
            ) : (
              <Text className="text-brand-dark text-[18px] font-bold tracking-wide">Login</Text>
            )}
          </Pressable>
        </View>

        <View className="flex-row justify-center mt-8 gap-2">
          <Text className="text-brand-muted text-[15px] font-medium">Don't have an account?</Text>
          <Pressable onPress={() => router.push("/auth/signup")} className="active:opacity-70">
            <Text className="text-brand-accent text-[15px] font-bold">Sign Up</Text>
          </Pressable>
        </View>
      </View>

      <StatusBar style="light" />
    </View>
  );
}
