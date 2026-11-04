import { Link } from "expo-router";
import { Text, View, Pressable } from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";

export default function Index() {
  return (
    <View className="flex-1 justify-between bg-brand-dark px-6">
      
      {/* Decorative top element for depth */}
      <View className="absolute top-0 inset-x-0 h-96 bg-brand-accent/5 rounded-b-[100px] -z-10" />

      {/* Brand */}
      <View className="mt-[140px] items-center">
        <View className="w-20 h-20 rounded-3xl bg-brand-card border border-brand-border items-center justify-center mb-6 shadow-sm shadow-brand-accent/20">
          <Ionicons name="wallet" size={40} color="#10B981" />
        </View>
        <Text className="text-[52px] font-extrabold text-white tracking-tight">
          Ledger<Text className="text-brand-accent">X</Text>
        </Text>
        <Text className="mt-3 text-[17px] text-brand-muted text-center font-medium leading-relaxed px-4">
          The minimal, fast, and reliable ledger for modern businesses.
        </Text>
      </View>

      {/* Buttons */}
      <View className="items-center mb-12 w-full">
        <Link href="/auth/signup" asChild>
          <Pressable
            className="w-full bg-brand-accent py-[18px] rounded-2xl items-center mb-4 active:scale-95 flex-row justify-center shadow-sm shadow-brand-accent/30"
          >
            <Text className="text-brand-dark text-[18px] font-bold tracking-wide mr-2">
              Create Account
            </Text>
            <Ionicons name="arrow-forward" size={20} color="#0A0A0A" />
          </Pressable>
        </Link>

        <Link href="/auth/login" asChild>
          <Pressable
            className="w-full bg-brand-card py-[18px] rounded-2xl border border-brand-border items-center active:scale-95"
          >
            <Text className="text-white text-[18px] font-semibold tracking-wide">
              Login
            </Text>
          </Pressable>
        </Link>
      </View>

      {/* Footer */}
      <Text className="text-center text-brand-muted/60 text-[13px] mb-8 font-medium">
        Empowering independent businesses
      </Text>

      <StatusBar style="light" />
    </View>
  );
}
