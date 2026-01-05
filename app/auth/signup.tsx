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

export default function SignupScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  const validateForm = () => {
    let valid = true;
    setEmailError(null);
    setPasswordError(null);
    setConfirmError(null);

    if (!email) {
      setEmailError("Email is required");
      valid = false;
    } else if (!/^\S+@\S+\.\S+$/.test(email)) {
      setEmailError("Invalid email address");
      valid = false;
    }

    if (!password) {
      setPasswordError("Password is required");
      valid = false;
    } else if (password.length < 6) {
      setPasswordError("Minimum 6 characters");
      valid = false;
    }

    if (password !== confirmPassword) {
      setConfirmError("Passwords do not match");
      valid = false;
    }

    return valid;
  };

  const onSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setError(null);

    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    router.replace("/home");
  };

  return (
    <View className="flex-1 bg-[#1a1a1a] justify-center px-5">
      <View className="bg-[#2a2a2a] rounded-xl p-6">
        <Text className="text-[28px] font-bold text-white mb-1.5">
          Create Account
        </Text>
        <Text className="text-[15px] text-[#aaa] mb-6">
          Start tracking your ledger
        </Text>

        <View className="gap-4.5">
          <View className="gap-1.5">
            <Text className="text-[13px] text-[#ccc] font-medium">Email</Text>
            <TextInput
              className="bg-[#333] border border-[#444] rounded-xl px-4 py-3.5 text-base text-white"
              placeholder="email@address.com"
              placeholderTextColor="#999"
              value={email}
              onChangeText={(t) => {
                setEmail(t);
                setEmailError(null);
              }}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            {emailError && (
              <Text className="text-[#ff6b6b] text-sm">{emailError}</Text>
            )}
          </View>

          <View className="gap-1.5">
            <Text className="text-[13px] text-[#ccc] font-medium">
              Password
            </Text>
            <TextInput
              className="bg-[#333] border border-[#444] rounded-xl px-4 py-3.5 text-base text-white"
              placeholder="Password"
              placeholderTextColor="#999"
              value={password}
              onChangeText={(t) => {
                setPassword(t);
                setPasswordError(null);
              }}
              secureTextEntry
            />
            {passwordError && (
              <Text className="text-[#ff6b6b] text-sm">{passwordError}</Text>
            )}
          </View>

          <View className="gap-1.5">
            <Text className="text-[13px] text-[#ccc] font-medium">
              Confirm Password
            </Text>
            <TextInput
              className="bg-[#333] border border-[#444] rounded-xl px-4 py-3.5 text-base text-white"
              placeholder="Confirm password"
              placeholderTextColor="#999"
              value={confirmPassword}
              onChangeText={(t) => {
                setConfirmPassword(t);
                setConfirmError(null);
              }}
              secureTextEntry
            />
            {confirmError && (
              <Text className="text-[#ff6b6b] text-sm">{confirmError}</Text>
            )}
          </View>

          {error && <Text className="text-[#ff6b6b] text-sm">{error}</Text>}

          <Pressable
            className={`bg-white py-4.5 rounded-xl items-center mt-3 ${loading ? "opacity-60" : ""}`}
            onPress={onSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text className="text-black text-lg font-bold">
                Create Account
              </Text>
            )}
          </Pressable>
        </View>

        <View className="flex-row justify-center mt-5 gap-1.5">
          <Text className="text-[#888] text-base">
            Already have an account?
          </Text>
          <Pressable onPress={() => router.push("/auth/login")}>
            <Text className="text-white text-base font-semibold">Sign In</Text>
          </Pressable>
        </View>
      </View>

      <StatusBar style="light" />
    </View>
  );
}
