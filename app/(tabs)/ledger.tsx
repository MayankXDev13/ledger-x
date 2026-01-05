import { useEffect, useState } from "react";
import { View, Text, FlatList, ActivityIndicator } from "react-native";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { LedgerEntry } from "@/types/database";
import { format } from "date-fns";

export default function LedgerScreen() {
  const { session } = useAuth();
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEntries = async () => {
    if (!session?.user) return;

    setLoading(true);
    const { data, error } = await supabase
      .from("ledger_entries")
      .select("*, contacts(name, phone)")
      .eq("contacts.user_id", session.user.id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("Error fetching entries:", error);
    } else {
      setEntries(data ?? []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchEntries();
  }, [session]);

  if (!session) {
    return null;
  }

  const formatAmount = (amount: number, type: string) => {
    const formatted = new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
    return type === "credit" ? `+${formatted}` : `-${formatted}`;
  };

  const renderEntry = ({
    item,
  }: {
    item: LedgerEntry & { contacts?: { name: string; phone: string } };
  }) => (
    <View className="flex-row items-center justify-between py-4 border-b border-[#333333]">
      <View className="flex-1">
        <Text className="text-white font-medium text-base">
          {item.contacts?.name || "Unknown"}
        </Text>
        <Text className="text-[#666666] text-xs mt-1">
          {format(new Date(item.created_at), "MMM d, yyyy h:mm a")}
        </Text>
        {item.note && (
          <Text className="text-[#888888] text-xs mt-1 italic">
            {item.note}
          </Text>
        )}
      </View>
      <Text
        className={`text-base font-semibold ${item.type === "credit" ? "text-green-500" : "text-red-500"}`}
      >
        {formatAmount(Number(item.amount), item.type)}
      </Text>
    </View>
  );

  return (
    <View className="flex-1 bg-[#1a1a1a]">
      <View className="px-6 pt-[60px] pb-4">
        <Text className="text-3xl font-bold text-white">Ledger</Text>
        <Text className="text-base text-[#888888] mt-1">
          Recent transactions
        </Text>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#ffffff" />
        </View>
      ) : entries.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-[#888888] text-lg">No transactions yet</Text>
          <Text className="text-[#666666] text-sm mt-2">
            Add your first entry from a customer
          </Text>
        </View>
      ) : (
        <FlatList
          data={entries}
          renderItem={renderEntry}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}
