import { useState } from "react";
import {
  View,
  Text,
  Pressable,
  FlatList,
  ActivityIndicator,
  Modal,
  Linking,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Link } from "expo-router";
import QRCode from "react-native-qrcode-svg";
import { useCollection } from "@/hooks/useInsights";
import { useSettings } from "@/hooks/useSettings";
import { useAuth } from "@/hooks/useAuth";
import { buildUpiUri } from "@/lib/upi";
import { formatCurrency } from "@/types/database";
import type { CollectionRow } from "@/lib/api";
import { cn } from "@/lib/cn";

function ageLabel(ageDays: number | null): string {
  if (ageDays === null) return "—";
  if (ageDays === 0) return "Today";
  if (ageDays === 1) return "1 day";
  return `${ageDays} days`;
}

function ageColor(ageDays: number | null): string {
  if (ageDays === null) return "#888888";
  if (ageDays > 60) return "#EF4444";
  if (ageDays > 30) return "#F59E0B";
  return "#10B981";
}

/**
 * Mobile collection view (task 7.5): FIFO-aged outstanding balances with a
 * UPI intent QR per customer. The QR encodes the same `upi://pay?...` URI as
 * web; payment completion is always recorded manually.
 */
export default function CollectionScreen() {
  const insets = useSafeAreaInsets();
  const [sort, setSort] = useState<"amount" | "age">("amount");
  const { data, loading, refresh } = useCollection(sort);
  const { settings } = useSettings();
  const { session } = useAuth();

  const [qrRow, setQrRow] = useState<CollectionRow | null>(null);

  const payeeName =
    settings?.payeeName?.trim() || session?.user.email.split("@")[0] || "Ledger-X";
  const upiId = settings?.upiId?.trim() ?? "";

  const upiUriFor = (row: CollectionRow) =>
    buildUpiUri({
      upiId,
      payeeName,
      amount: row.outstanding,
      note: `Khata balance for ${row.name}`,
    });

  const shareLink = async (row: CollectionRow) => {
    if (!upiId) return;
    const url = upiUriFor(row);
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert(
        "No UPI app found",
        "Copy the link instead?",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Show QR", onPress: () => setQrRow(row) },
        ],
      );
    }
  };

  const rows = data?.data ?? [];

  const renderItem = ({ item }: { item: CollectionRow }) => (
    <View className="flex-row items-center px-6 py-4 border-b border-brand-border gap-3">
      <View className="w-9 h-9 rounded-lg bg-[#10B981]/10 items-center justify-center">
        <Text className="text-[#10B981] font-bold text-sm">
          {item.name.charAt(0).toUpperCase()}
        </Text>
      </View>
      <View className="flex-1">
        <Link href={`/customers/details?id=${item.customerId}`} asChild>
          <Pressable>
            <Text className="text-white font-medium text-base">{item.name}</Text>
          </Pressable>
        </Link>
        <Text className="text-[#666666] text-xs mt-0.5">{item.phone}</Text>
      </View>
      <View className="items-end mr-1">
        <Text className="text-white font-bold text-sm">
          {formatCurrency(item.outstanding)}
        </Text>
        <Text
          className="text-[11px] mt-0.5"
          style={{ color: ageColor(item.ageDays) }}
        >
          Oldest unpaid: {ageLabel(item.ageDays)}
        </Text>
      </View>
      <Pressable
        onPress={() => (upiId ? shareLink(item) : undefined)}
        disabled={!upiId}
        className={cn(
          "w-10 h-10 rounded-lg border items-center justify-center",
          upiId ? "border-[#10B981]/40 bg-[#10B981]/10" : "border-[#333333]",
        )}
        accessibilityRole="button"
        accessibilityLabel={`Collect from ${item.name} via UPI`}
      >
        <Ionicons
          name="qr-code-outline"
          size={18}
          color={upiId ? "#10B981" : "#555555"}
        />
      </Pressable>
    </View>
  );

  return (
    <View className="flex-1 bg-brand-dark">
      <View className="px-6 pb-4" style={{ paddingTop: insets.top + 16 }}>
        <Text className="text-3xl font-bold text-white">Collection</Text>
        <Text className="text-base text-[#888888] mt-1">
          {rows.length} customer{rows.length === 1 ? "" : "s"} with a balance
        </Text>
      </View>

      {/* Summary + sort */}
      <View className="px-6 gap-3">
        <View className="rounded-xl border border-[#10B981]/25 bg-[#10B981]/5 p-4">
          <Text className="text-[10px] font-semibold uppercase tracking-widest text-[#888888]">
            Total receivables
          </Text>
          <Text className="text-2xl font-bold text-white mt-1">
            {loading ? "—" : formatCurrency(data?.totalReceivables ?? 0)}
          </Text>
          {upiId ? (
            <Text className="text-xs text-[#888888] mt-1" numberOfLines={1}>
              Collect via UPI · {upiId}
            </Text>
          ) : (
            <Text className="text-xs text-[#F59E0B] mt-1">
              Add your UPI ID in Profile → Collection settings to enable QRs.
            </Text>
          )}
        </View>

        <View className="flex-row gap-2">
          {(["amount", "age"] as const).map((option) => (
            <Pressable
              key={option}
              onPress={() => setSort(option)}
              className={cn(
                "flex-1 rounded-lg border py-2.5 items-center",
                sort === option
                  ? "border-[#10B981] bg-[#10B981]/10"
                  : "border-[#333333] bg-[#1F1F1F]",
              )}
            >
              <Text
                className={cn(
                  "text-xs font-semibold",
                  sort === option ? "text-[#10B981]" : "text-[#888888]",
                )}
              >
                Sort by {option}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#ffffff" />
        </View>
      ) : rows.length === 0 ? (
        <View className="flex-1 items-center justify-center px-10">
          <Ionicons name="hand-left-outline" size={44} color="#444" />
          <Text className="text-[#888888] text-lg font-medium mt-4">
            Nothing to collect
          </Text>
          <Text className="text-[#666666] text-sm text-center mt-2">
            Every customer is settled. Add a customer and record a credit to see
            outstanding balances here.
          </Text>
          <Link href="/customers/add" asChild>
            <Pressable className="mt-5 rounded-lg bg-[#10B981] px-5 py-3">
              <Text className="text-black text-sm font-bold">Add a customer</Text>
            </Pressable>
          </Link>
        </View>
      ) : (
        <FlatList
          data={rows}
          renderItem={renderItem}
          keyExtractor={(item) => item.customerId}
          contentContainerStyle={{
            paddingTop: 12,
            paddingBottom: insets.bottom + 24,
          }}
          showsVerticalScrollIndicator={false}
          onRefresh={refresh}
          refreshing={loading}
        />
      )}

      {/* QR dialog */}
      <Modal
        visible={!!qrRow}
        transparent
        animationType="fade"
        onRequestClose={() => setQrRow(null)}
      >
        <View className="flex-1 bg-black/70 items-center justify-center px-8">
          <View className="w-full rounded-2xl bg-[#171717] border border-[#333333] p-6 items-center">
            <Text className="text-lg font-bold text-white">
              Collect from {qrRow?.name}
            </Text>
            <Text className="text-xs text-[#888888] text-center mt-1">
              Scan with any UPI app to pay{" "}
              {formatCurrency(qrRow?.outstanding ?? 0)} to {payeeName}
            </Text>
            {qrRow && upiId && (
              <View className="bg-white p-4 rounded-xl mt-5">
                <QRCode value={upiUriFor(qrRow)} size={200} />
              </View>
            )}
            <Text className="text-[10px] text-[#666666] text-center mt-4">
              Payment completion is recorded manually in the customer ledger.
            </Text>
            <Pressable
              onPress={() => setQrRow(null)}
              className="mt-4 px-6 py-2.5 rounded-lg border border-[#333333]"
            >
              <Text className="text-xs font-semibold text-white">Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}
