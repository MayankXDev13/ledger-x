import { Pressable, Text, View } from "react-native";
import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { cn } from "@/lib/cn";
import type { QueueItem } from "@/lib/queue-core";

interface OfflinePendingBarProps {
  outstanding: number;
  syncing: boolean;
  isOnline: boolean;
  items: QueueItem[];
  onRetry: (id: string) => void;
  onDiscard: (id: string) => void;
}

/**
 * Pending indicator + failed-item review. While offline the bar explains the
 * pending state; failed (server-rejected) items are listed with retry and
 * discard actions so a rejected write is visible rather than dropped.
 */
export function OfflinePendingBar({
  outstanding,
  syncing,
  isOnline,
  items,
  onRetry,
  onDiscard,
}: OfflinePendingBarProps) {
  const [expanded, setExpanded] = useState(false);

  if (outstanding === 0) return null;

  const failed = items.filter((item) => item.status === "failed");
  const pending = items.filter((item) => item.status === "pending");

  return (
    <View className="mx-6 mb-3 rounded-xl border border-[#3D3D3D] bg-[#1F1F1F] overflow-hidden">
      <Pressable
        onPress={() => setExpanded((value) => !value)}
        className="flex-row items-center px-4 py-3 gap-2"
        accessibilityRole="button"
      >
        <Ionicons
          name={syncing ? "sync" : isOnline ? "cloud-offline" : "cloud-offline-outline"}
          size={16}
          color={failed.length > 0 ? "#F59E0B" : "#10B981"}
        />
        <Text className="flex-1 text-xs text-[#CCCCCC]">
          {syncing
            ? "Syncing…"
            : !isOnline
              ? `Offline · ${outstanding} change${outstanding === 1 ? "" : "s"} will sync automatically`
              : failed.length > 0
                ? `${failed.length} item${failed.length === 1 ? "" : "s"} need attention · ${pending.length} pending`
                : `${outstanding} change${outstanding === 1 ? "" : "s"} pending sync`}
        </Text>
        <Ionicons
          name={expanded ? "chevron-up" : "chevron-down"}
          size={14}
          color="#888888"
        />
      </Pressable>

      {expanded && (
        <View className="border-t border-[#3D3D3D]">
          {[...failed, ...pending].map((item) => (
            <View
              key={item.id}
              className="flex-row items-center px-4 py-2.5 border-b border-[#2D2D2D] gap-2"
            >
              <View className="flex-1">
                <Text className="text-xs text-white" numberOfLines={1}>
                  {item.kind === "customer.create"
                    ? `Customer: ${String(item.payload.name ?? "")}`
                    : `${item.payload.type === "credit" ? "Credit" : "Payment"} ₹${String(item.payload.amount ?? "")}`}
                </Text>
                {item.lastError && (
                  <Text className="text-[10px] text-[#F59E0B]" numberOfLines={1}>
                    {item.lastError}
                  </Text>
                )}
              </View>
              {item.status === "failed" ? (
                <>
                  <Pressable
                    onPress={() => onRetry(item.id)}
                    className="px-2.5 py-1.5 rounded-lg bg-[#10B981]/15"
                    accessibilityRole="button"
                    accessibilityLabel="Retry failed sync"
                  >
                    <Text className="text-[10px] font-semibold text-[#10B981]">
                      Retry
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => onDiscard(item.id)}
                    className="px-2.5 py-1.5 rounded-lg bg-[#EF4444]/15"
                    accessibilityRole="button"
                    accessibilityLabel="Discard failed sync item"
                  >
                    <Text className="text-[10px] font-semibold text-[#EF4444]">
                      Discard
                    </Text>
                  </Pressable>
                </>
              ) : (
                <Text className={cn("text-[10px] text-[#666666]")}>
                  {syncing ? "Syncing" : "Waiting"}
                </Text>
              )}
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
