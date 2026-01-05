import { Link } from "expo-router";
import { Text, View, Pressable } from "react-native";

export default function Index() {
  return (
    <View className="flex-1 justify-between bg-[#1a1a1a] px-6">
      
      {/* Brand */}
      <View className="mt-[120px] items-center">
        <Text className="text-[52px] font-extrabold text-white tracking-tight">
          LedgerX
        </Text>
        <Text className="mt-2 text-base text-gray-400">
          Simple • Fast • Reliable Ledger
        </Text>
      </View>

      {/* Buttons */}
      <View className="items-center mb-10">
        <Link href="/auth/login" asChild>
          <Pressable
            className="w-[320px] bg-white py-[18px] rounded-[14px] items-center mb-4 active:scale-95"
          >
            <Text className="text-black text-[19px] font-bold ">
              Login
            </Text>
          </Pressable>
        </Link>

        <Link href="/auth/signup" asChild>
          <Pressable
            className="w-[320px] py-[18px] rounded-[14px] border-2 border-white items-center active:scale-95"
          >
            <Text className="text-white text-[18px] font-semibold">
              Create Account
            </Text>
          </Pressable>
        </Link>
      </View>

      {/* Footer */}
      <Text className="text-center text-gray-500 text-[13px] mb-4 ">
        Made for small businesses
      </Text>
    </View>
  );
}
