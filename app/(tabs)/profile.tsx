import { useState } from "react";
import { Text, View, Pressable } from "react-native";
import { router } from "expo-router";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { Ionicons } from "@expo/vector-icons";

export default function ProfileScreen() {
  const { session } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);
    await supabase.auth.signOut();
    router.replace("/auth/login");
  };

  if (!session) {
    return null;
  }

  return (
    <View className="flex-1 bg-[#1a1a1a]">
      <View className="px-6 pt-[60px] pb-6">
        <Text className="text-3xl font-bold text-white">Profile</Text>
      </View>

      <View className="items-center py-10">
        <View className="w-24 h-24 rounded-full bg-[#2a2a2a] items-center justify-center mb-4">
          <Ionicons name="person" size={48} color="#ffffff" />
        </View>
        <Text className="text-white text-lg font-medium">
          {session.user.email}
        </Text>
      </View>

      <View className="px-6 gap-4">
        <Pressable
          className="flex-row items-center justify-center py-4 rounded-xl gap-3 border bg-[#2a2a2a] border-[#3a3a3a]"
          onPress={() => router.push("/tags/manage")}
        >
          <Ionicons name="pricetags-outline" size={20} color="#ffffff" />
          <Text className="text-white text-base font-semibold">
            Manage Tags
          </Text>
        </Pressable>

        <Pressable
          className={`flex-row items-center justify-center py-4 rounded-xl gap-3 ${isLoggingOut ? "opacity-50" : "bg-white"}`}
          onPress={() => router.push("/auth/update-password")}
          disabled={isLoggingOut}
        >
          <Ionicons name="lock-closed-outline" size={20} color="#000000" />
          <Text className="text-black text-base font-semibold">
            Change Password
          </Text>
        </Pressable>

        <Pressable
          className="flex-row items-center justify-center py-4 rounded-xl gap-3 border border-[#ff6b6b]"
          onPress={handleLogout}
          disabled={isLoggingOut}
        >
          <Ionicons name="log-out-outline" size={20} color="#ff6b6b" />
          <Text className="text-[#ff6b6b] text-base font-semibold">
            {isLoggingOut ? "Logging out..." : "Logout"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
