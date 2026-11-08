import { useCallback, useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  View,
  Text,
  FlatList,
  Pressable,
  ActivityIndicator,
  TextInput,
} from "react-native";
import { useFocusEffect, Link } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/hooks/useAuth";
import { customersApi, type Customer } from "@/lib/api";
import { useOfflineQueue } from "@/hooks/useOfflineQueue";
import { OfflinePendingBar } from "@/components/OfflinePendingBar";

export default function CustomersScreen() {
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const {
    outstanding,
    items,
    syncing,
    isOnline,
    retry,
    discard,
  } = useOfflineQueue();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchCustomers = useCallback(async () => {
    try {
      setCustomers(await customersApi.list());
    } catch (error) {
      console.error("Error fetching customers:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchCustomers();
    }, [fetchCustomers]),
  );

  if (!session) {
    return null;
  }

  const filteredCustomers = customers.filter((contact) => {
    const matchesSearch =
      contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.phone.includes(searchQuery);

    return matchesSearch;
  });

  const renderCustomer = ({ item }: { item: Customer }) => (
    <Link href={`/customers/details?id=${item.id}`} asChild>
      <Pressable className="flex-row items-center justify-between py-4 border-b border-brand-border">
        <View className="flex-1">
          <View className="flex-row items-center gap-2">
            <Text className="text-white font-medium text-lg">{item.name}</Text>
            {item.isSample && (
              <View className="rounded bg-[#F59E0B]/15 px-1.5 py-0.5">
                <Text className="text-[#F59E0B] text-[9px] font-bold uppercase">
                  Sample
                </Text>
              </View>
            )}
          </View>
          <Text className="text-[#888888] text-sm mt-1">{item.phone}</Text>
        </View>
        <Text className="text-[#666666] text-xl ml-3">›</Text>
      </Pressable>
    </Link>
  );

  return (
    <View className="flex-1 bg-brand-dark">
      <View className="px-6 pb-4" style={{ paddingTop: insets.top + 16 }}>
        <Text className="text-3xl font-bold text-white">Customers</Text>
        <Text className="text-base text-[#888888] mt-1">
          {filteredCustomers.length} contacts
          {!isOnline && " · showing cached data (offline)"}
        </Text>
      </View>

      <View className="px-6 mb-3">
        <TextInput
          className="border border-brand-border rounded-lg px-4 py-3 text-base text-white bg-brand-card mb-1"
          placeholder="Search customers..."
          placeholderTextColor="#666666"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <View className="px-6">
        <OfflinePendingBar
          outstanding={outstanding}
          syncing={syncing}
          isOnline={isOnline}
          items={items}
          onRetry={retry}
          onDiscard={discard}
        />
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#ffffff" />
        </View>
      ) : filteredCustomers.length === 0 ? (
        <View className="flex-1 items-center justify-center px-10">
          <Ionicons name="people-outline" size={44} color="#444" />
          <Text className="text-[#888888] text-lg mt-4">
            {searchQuery ? "No customers found" : "No customers yet"}
          </Text>
          {!searchQuery && (
            <>
              <Text className="text-[#666666] text-sm text-center mt-2">
                Add a customer to start recording credits and payments.
              </Text>
              <Link href="/customers/add" asChild>
                <Pressable className="mt-5 rounded-lg bg-[#10B981] px-5 py-3">
                  <Text className="text-black text-sm font-bold">
                    Add your first customer
                  </Text>
                </Pressable>
              </Link>
            </>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredCustomers}
          renderItem={renderCustomer}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{
            paddingHorizontal: 24,
            paddingBottom: insets.bottom + 88,
          }}
          showsVerticalScrollIndicator={false}
        />
      )}

      <Link href="/customers/add" asChild>
        <Pressable
          style={{
            position: "absolute",
            bottom: insets.bottom + 16,
            right: 16,
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: "#ffffff",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name="add" size={28} color="#000000" />
        </Pressable>
      </Link>
    </View>
  );
}
