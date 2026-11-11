import { useCallback, useMemo, useState } from "react";
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
import { customersApi, collectionApi, type Customer } from "@/lib/api";
import { useOfflineQueue } from "@/hooks/useOfflineQueue";
import { OfflinePendingBar } from "@/components/OfflinePendingBar";
import { CustomerAvatar } from "@/components/CustomerAvatar";
import { MoneyText } from "@/components/MoneyText";
import { AgingStrip } from "@/components/AgingStrip";
import { colors } from "@/lib/theme";
import { usePressable } from "@/lib/press-feedback";
import { ErrorState } from "@/components/ErrorState";

type Balance = { outstanding: number; ageDays: number | null };

export default function CustomersScreen() {
  const press = usePressable();
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const {
    outstanding,
    items,
    syncing,
    isOnline,
    retry,
    discard,
    pendingCustomers,
  } = useOfflineQueue();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [balances, setBalances] = useState<Record<string, Balance>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchCustomers = useCallback(async () => {
    try {
      const [list, balMap] = await Promise.all([
        customersApi.list(),
        customersApi.balances().catch(() => null),
      ]);
      setCustomers(list);
      if (balMap) {
        setBalances(balMap);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load your customers");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchCustomers();
    }, [fetchCustomers]),
  );

  /**
   * Customers created offline are queued locally, so they are merged into the
   * list here instead of waiting for the server. Once they sync, the server
   * list contains them and the queue drops them, so nothing appears twice.
   */
  const visibleCustomers = useMemo<Customer[]>(
    () => [
      ...pendingCustomers.map((customer) => ({
        id: customer.id,
        userId: "",
        name: customer.name,
        phone: customer.phone,
      })),
      ...customers,
    ],
    [customers, pendingCustomers],
  );

  const q = searchQuery.trim().toLowerCase();
  const filteredCustomers = visibleCustomers.filter(
    (contact) =>
      contact.name.toLowerCase().includes(q) || contact.phone.includes(q),
  );

  if (!session) {
    return null;
  }

  const renderCustomer = ({ item }: { item: Customer }) => {
    const b = balances[item.id];
    const hasBalance = !!b && b.outstanding > 0;
    return (
      <Link href={`/customers/details?id=${item.id}`} asChild>
        <Pressable
          onPressIn={press.onPressIn}
          onPressOut={press.onPressOut}
          style={press.animatedStyle}
          className="flex-row items-center gap-3 border-b border-line py-3.5 active:opacity-80"
          accessibilityRole="button"
          accessibilityLabel={`${item.name}, ${item.phone}${
            hasBalance ? `, ${b.ageDays ?? 0} days unpaid` : ""
          }`}
        >
          <CustomerAvatar name={item.name} size={40} />
          <View className="flex-1">
            <Text
              className="font-mukta-semibold text-[15px] text-ink"
              numberOfLines={1}
            >
              {item.name}
            </Text>
            <Text
              className="mt-0.5 font-mukta text-[12px] text-ink-muted"
              numberOfLines={1}
            >
              {item.phone}
            </Text>
          </View>
          {hasBalance ? (
            <View className="w-[92px] items-end">
              <MoneyText value={b.outstanding} numberOfLines={1} />
              <Text
                className={`mt-0.5 font-mukta text-[11px] ${
                  b.ageDays !== null && b.ageDays > 60
                    ? "text-danger-text"
                    : "text-ink-muted"
                }`}
              >
                {b.ageDays === null ? "Unpaid" : `Unpaid ${b.ageDays}d`}
              </Text>
              <AgingStrip
                mode="bucket"
                ageDays={b.ageDays}
                className="mt-2 w-[64px]"
              />
            </View>
          ) : (
            <Text className="font-mukta text-[12px] text-ink-muted">Settled</Text>
          )}
          <Ionicons name="chevron-forward" size={17} color={colors.inkMuted} />
        </Pressable>
      </Link>
    );
  };

  return (
    <View className="flex-1 bg-bg">
      <View className="px-5 pb-3" style={{ paddingTop: insets.top + 12 }}>
        <View className="flex-row items-baseline justify-between">
          <Text className="font-mukta-bold text-[24px] leading-[30px] text-ink">
            Customers
          </Text>
          <Text className="font-plex text-[11px] uppercase tracking-[1.2px] text-ink-muted">
            {customers.length} total
          </Text>
        </View>

        <View className="mt-3 flex-row items-center gap-2 rounded-xl border border-line bg-surface-raised px-3">
          <Ionicons name="search" size={16} color={colors.inkMuted} />
          <TextInput
            className="flex-1 py-3 font-mukta text-[15px] text-ink"
            placeholder="Search by name or phone"
            placeholderTextColor={colors.inkFaint}
            value={searchQuery}
            onChangeText={setSearchQuery}
            accessibilityLabel="Search customers"
          />
          {searchQuery.length > 0 && (
            <Pressable
              onPress={() => setSearchQuery("")}
              className="min-h-[44px] min-w-[44px] items-center justify-center active:opacity-70"
              accessibilityRole="button"
              accessibilityLabel="Clear search"
            >
              <Ionicons name="close" size={16} color={colors.inkMuted} />
            </Pressable>
          )}
        </View>
      </View>

      <View className="px-5">
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
          <ActivityIndicator size="large" color={colors.brand} />
        </View>
      ) : error ? (
        <View className="flex-1 justify-center px-5">
          <ErrorState
            title="Could not load your customers"
            message={error}
            onRetry={fetchCustomers}
          />
        </View>
      ) : filteredCustomers.length === 0 ? (
        <View className="flex-1 items-center justify-center px-10">
          <Ionicons name="people-outline" size={40} color={colors.inkFaint} />
          <Text className="mt-4 font-mukta-semibold text-[17px] text-ink">
            {searchQuery ? "No customers found" : "No customers yet"}
          </Text>
          {!searchQuery && (
            <>
              <Text className="mt-2 text-center font-mukta text-[13px] text-ink-muted">
                Add a customer to start recording credits and payments.
              </Text>
              <Link href="/customers/add" asChild>
                <Pressable
                  className="mt-5 min-h-[48px] items-center justify-center rounded-xl bg-brand-primary-fill px-5 active:opacity-80"
                  accessibilityRole="button"
                >
                  <Text className="font-mukta-semibold text-[15px] text-white">
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
            paddingHorizontal: 20,
            paddingBottom: insets.bottom + 96,
          }}
          showsVerticalScrollIndicator={false}
        />
      )}

      <Link href="/customers/add" asChild>
        <Pressable
          style={{
            position: "absolute",
            bottom: insets.bottom + 16,
            right: 20,
            width: 56,
            height: 56,
            borderRadius: 28,
          }}
          className="items-center justify-center bg-brand-primary-fill active:opacity-80"
          accessibilityRole="button"
          accessibilityLabel="Add customer"
        >
          <Ionicons name="add" size={28} color={colors.ink} />
        </Pressable>
      </Link>
    </View>
  );
}
