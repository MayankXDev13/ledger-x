import { useEffect, useState, useCallback } from "react";
import { View, Text, FlatList, ActivityIndicator, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Link, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
  customersApi,
  dashboardApi,
  type Customer,
  type Transaction,
} from "@/lib/api";
import { format } from "date-fns";
import { isPaymentEntry, paymentMethodLabel } from "@/lib/payments";
import { formatCurrency } from "@/types/database";

export default function LedgerScreen() {
  const insets = useSafeAreaInsets();
  const [entries, setEntries] = useState<Transaction[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    try {
      const [recent, customerRows] = await Promise.all([
        dashboardApi.recentTransactions(),
        customersApi.list(),
      ]);
      setEntries(recent);
      setCustomers(customerRows);
    } catch (error) {
      console.error("Error fetching entries:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchEntries();
    }, [fetchEntries]),
  );

  const customerName = (customerId: string) =>
    customers.find((c) => c.id === customerId)?.name ?? "Unknown";

  const formatAmount = (amount: number, type: string) => {
    const formatted = new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
    return type === "credit" ? `+${formatted}` : `-${formatted}`;
  };

  const renderEntry = ({ item }: { item: Transaction }) => {
    const isCredit = item.type === "credit";
    const isPayment = isPaymentEntry(item);
    const method = paymentMethodLabel(item.paymentMethod);

    return (
      <Link href={`/customers/details?id=${item.customerId}`} asChild>
        <Pressable className="flex-row items-center justify-between py-4 border-b border-brand-border">
          <View className="flex-1">
            <View className="flex-row items-center gap-2">
              <Text className="text-white font-medium text-base">
                {customerName(item.customerId)}
              </Text>
              {isPayment && method && (
                <View className="rounded bg-[#F59E0B]/12 px-1.5 py-0.5">
                  <Text className="text-[#F59E0B] text-[9px] font-bold">
                    {method}
                  </Text>
                </View>
              )}
            </View>
            <Text className="text-[#666666] text-xs mt-1">
              {format(new Date(item.createdAt), "MMM d, yyyy h:mm a")}
            </Text>
            {item.note && (
              <Text className="text-[#888888] text-xs mt-1 italic">
                {item.note}
              </Text>
            )}
          </View>
          <Text
            className={`text-base font-semibold ${
              isPayment
                ? "text-[#F59E0B]"
                : isCredit
                  ? "text-green-500"
                  : "text-red-500"
            }`}
          >
            {formatAmount(Number(item.amount), item.type)}
          </Text>
        </Pressable>
      </Link>
    );
  };

  return (
    <View className="flex-1 bg-brand-dark">
      <View className="px-6 pb-4" style={{ paddingTop: insets.top + 16 }}>
        <Text className="text-3xl font-bold text-white">Ledger</Text>
        <Text className="text-base text-[#888888] mt-1">
          Recent activity across all customers
        </Text>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#ffffff" />
        </View>
      ) : entries.length === 0 ? (
        <View className="flex-1 items-center justify-center px-10">
          <Ionicons name="journal-outline" size={44} color="#444" />
          <Text className="text-[#888888] text-lg mt-4">
            No transactions yet
          </Text>
          <Text className="text-[#666666] text-sm text-center mt-2">
            Open a customer and record a credit or payment to see it here.
          </Text>
          <Link href="/customers" asChild>
            <Pressable className="mt-5 rounded-lg bg-[#10B981] px-5 py-3">
              <Text className="text-black text-sm font-bold">
                Go to customers
              </Text>
            </Pressable>
          </Link>
        </View>
      ) : (
        <FlatList
          data={entries}
          renderItem={renderEntry}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{
            paddingHorizontal: 24,
            paddingBottom: insets.bottom + 24,
          }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}
