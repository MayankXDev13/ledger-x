import { useState } from "react";
import { View, Text, Pressable, ActivityIndicator, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/hooks/useAuth";
import { signInWithGoogle } from "@/lib/auth-session";

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const [loading, setLoading] = useState(false);

  if (session) {
    router.replace("/(tabs)/customers");
    return null;
  }

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
      router.replace("/(tabs)/customers");
    } catch (err) {
      Alert.alert(
        "Sign-in failed",
        err instanceof Error ? err.message : "Please try again",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View
      className="flex-1 bg-brand-dark items-center justify-center px-8"
      style={{ paddingTop: insets.top }}
    >
      <Text className="text-white text-3xl font-bold mb-2">LedgerX</Text>
      <Text className="text-[#888888] text-base mb-10 text-center">
        Sign in with your Google account to continue
      </Text>
      <Pressable
        className="flex-row items-center justify-center py-4 px-6 rounded-xl gap-3 bg-white w-full"
        onPress={handleGoogleSignIn}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#000" />
        ) : (
          <>
            <Ionicons name="logo-google" size={20} color="#000000" />
            <Text className="text-black text-base font-semibold">
              Continue with Google
            </Text>
          </>
        )}
      </Pressable>
    </View>
  );
}
