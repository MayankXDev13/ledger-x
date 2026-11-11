import { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  SectionList,
  ActivityIndicator,
  Pressable,
  TextInput,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Link, router, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { format, isToday, isYesterday } from "date-fns";
import {
  customersApi,
  dashboardApi,
  type Customer,
  type PaymentMethod,
  type Transaction,
} from "@/lib/api";
import { CustomerAvatar } from "@/components/CustomerAvatar";
import { MoneyText } from "@/components/MoneyText";
import { Button } from "@/components/Button";
import { colors } from "@/lib/theme";
import { usePressable } from "@/lib/press-feedback";
import { ErrorState } from "@/components/ErrorState";
import { useOfflineQueue } from "@/hooks/useOfflineQueue";

type Filter = "all" | "credit" | "debit";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "credit", label: "Credit" },
  { key: "debit", label: "Payment" },
];

function subtitleFor(t: Transaction): string {
  if (t.note) return t.note;
  if (t.type === "credit") return "Credit note";
  const m = (t.paymentMethod ?? "").toLowerCase();
  if (m === "upi") return "UPI payment";
  if (m) return "Payment received";
  return "Payment received";
}

function dayLabel(date: Date): string {
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  return format(date, "d MMM").toUpperCase();
}

export default function LedgerScreen() {
  const insets = useSafeAreaInsets();
  const press = usePressable();
  const { pendingEntries } = useOfflineQueue();
  const [entries, setEntries] = useState<Transaction[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    try {
      setError(null);
      const [recent, customerRows] = await Promise.all([
        dashboardApi.recentTransactions(),
        customersApi.list(),
      ]);
      setEntries(recent);
      setCustomers(customerRows);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load your ledger");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchEntries();
    }, [fetchEntries]),
  );

  const customerName = useCallback(
    (customerId: string) =>
      customers.find((c) => c.id === customerId)?.name ?? "Unknown",
    [customers],
  );

  const counts = useMemo(
    () => ({
      all: entries.length,
      credit: entries.filter((entry) => entry.type === "credit").length,
      debit: entries.filter((entry) => entry.type === "debit").length,
    }),
    [entries],
  );

  /**
   * Entries recorded offline are queued locally, so they are merged into the
   * list here instead of waiting for the server. Once they sync, the server
   * list contains them and the queue drops them, so nothing appears twice.
   */
  const visibleEntries = useMemo(() => {
    const queued: Transaction[] = pendingEntries.map((entry) => ({
      id: entry.id,
      userId: "",
      customerId: entry.customerId,
      amount: entry.amount,
      type: entry.type,
      paymentMethod: (entry.paymentMethod as PaymentMethod | null) ?? null,
      note: entry.note ?? undefined,
      createdAt: entry.createdAt,
    }));
    return [...queued, ...entries].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }, [entries, pendingEntries]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return visibleEntries.filter((entry) => {
      if (filter !== "all" && entry.type !== filter) return false;
      if (!q) return true;
      return (
        customerName(entry.customerId).toLowerCase().includes(q) ||
        (entry.note ?? "").toLowerCase().includes(q)
      );
    });
  }, [visibleEntries, filter, query, customerName]);

  const sections = useMemo(() => {
    const grouped = new Map<string, { title: string; data: Transaction[] }>();
    for (const entry of filtered) {
      const date = new Date(entry.createdAt);
      const key = format(date, "yyyy-MM-dd");
      const existing = grouped.get(key);
      if (existing) {
        existing.data.push(entry);
      } else {
        grouped.set(key, { title: dayLabel(date), data: [entry] });
      }
    }
    return [...grouped.values()];
  }, [filtered]);

  const renderEntry = ({ item }: { item: Transaction }) => {
    const isCredit = item.type === "credit";
    return (
      <Link href={`/customers/details?id=${item.customerId}`} asChild>
        <Pressable
          onPressIn={press.onPressIn}
          onPressOut={press.onPressOut}
          style={press.animatedStyle}
          className="flex-row items-center gap-3 border-b border-line py-3.5 active:opacity-80"
          accessibilityRole="button"
          accessibilityLabel={`${customerName(item.customerId)}, ${
            isCredit ? "credit" : "payment"
          } ${item.amount}`}
        >
          <CustomerAvatar name={customerName(item.customerId)} size={40} />
          <View className="flex-1">
            <Text
              className="font-mukta-semibold text-[15px] text-ink"
              numberOfLines={1}
            >
              {customerName(item.customerId)}
            </Text>
            <Text
              className="mt-0.5 font-mukta text-[12px] text-ink-muted"
              numberOfLines={1}
            >
              {subtitleFor(item)}
            </Text>
          </View>
          <View className="items-end">
            <MoneyText
              value={Number(item.amount)}
              sign={isCredit ? "+" : "-"}
              tone={isCredit ? "default" : "positive"}
            />
            <Text className="mt-0.5 font-mukta text-[11px] text-ink-muted">
              {format(new Date(item.createdAt), "d MMM")}
            </Text>
          </View>
        </Pressable>
      </Link>
    );
  };

  return (
    <View className="flex-1 bg-bg">
      <View
        className="px-5 pb-3"
        style={{ paddingTop: insets.top + 12 }}
      >
        <View className="flex-row items-baseline justify-between">
          <Text className="font-mukta-bold text-[24px] leading-[30px] text-ink">
            Ledger
          </Text>
          <Text className="font-plex text-[11px] uppercase tracking-[1.2px] text-ink-muted">
            {entries.length} {entries.length === 1 ? "entry" : "entries"}
          </Text>
        </View>
        <Text className="mt-0.5 font-mukta text-[12px] text-ink-muted">
          Recent activity · last 5
        </Text>

        <View className="mt-3 flex-row items-center gap-2 rounded-xl border border-line bg-surface-raised px-3">
          <Ionicons name="search" size={16} color={colors.inkMuted} />
          <TextInput
            className="flex-1 py-3 font-mukta text-[15px] text-ink"
            placeholder="Search by name or note"
            placeholderTextColor={colors.inkFaint}
            value={query}
            onChangeText={setQuery}
            accessibilityLabel="Search recent ledger entries"
          />
          {query.length > 0 && (
            <Pressable
              onPress={() => setQuery("")}
              className="min-h-[44px] min-w-[44px] items-center justify-center active:opacity-70"
              accessibilityRole="button"
              accessibilityLabel="Clear search"
            >
              <Ionicons name="close" size={16} color={colors.inkMuted} />
            </Pressable>
          )}
        </View>
      </View>

      <View className="flex-row gap-6 px-5">
        {FILTERS.map((option) => {
          const active = filter === option.key;
          return (
            <Pressable
              key={option.key}
              onPress={() => setFilter(option.key)}
              onPressIn={press.onPressIn}
              onPressOut={press.onPressOut}
              style={press.animatedStyle}
              className="min-h-[44px] justify-center active:opacity-70"
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              accessibilityLabel={`${option.label}, ${counts[option.key]} entries`}
            >
              <Text
                className={`font-mukta-semibold text-[14px] ${
                  active ? "text-ink" : "text-ink-muted"
                }`}
              >
                {option.label}{" "}
                <Text className="font-mukta text-[12px] text-ink-muted">
                  {counts[option.key]}
                </Text>
              </Text>
              <View
                className={`mt-1 h-[2px] rounded-full ${
                  active ? "bg-brand-primary" : "bg-transparent"
                }`}
              />
            </Pressable>
          );
        })}
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.brand} />
        </View>
      ) : error ? (
        <View className="flex-1 justify-center px-5">
          <ErrorState
            title="Could not load your ledger"
            message={error}
            onRetry={fetchEntries}
          />
        </View>
      ) : filtered.length === 0 ? (
        <View className="flex-1 items-center justify-center px-10">
          <Ionicons name="journal-outline" size={40} color={colors.inkFaint} />
          <Text className="mt-4 font-mukta-semibold text-[17px] text-ink">
            {query || filter !== "all"
              ? "No matching entries"
              : "No transactions yet"}
          </Text>
          <Text className="mt-2 text-center font-mukta text-[13px] text-ink-muted">
            {query || filter !== "all"
              ? "Clear the search or choose All to see recent activity."
              : "Open a customer and record a credit or payment to see it here."}
          </Text>
          {!query && filter === "all" && (
            <Button
              title="Go to customers"
              variant="secondary"
              className="mt-5"
              onPress={() => router.push("/(tabs)/customers")}
            />
          )}
        </View>
      ) : (
        <SectionList
          sections={sections}
          renderItem={renderEntry}
          keyExtractor={(item) => item.id}
          stickySectionHeadersEnabled
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingBottom: insets.bottom + 28,
          }}
          showsVerticalScrollIndicator={false}
          renderSectionHeader={({ section }) => (
            <View className="bg-bg pb-2 pt-4">
              <Text className="font-plex text-[11px] uppercase tracking-[1.5px] text-ink-muted">
                {section.title}
              </Text>
              <View className="mt-1.5 h-px bg-line" />
            </View>
          )}
        />
      )}
    </View>
  );
}
