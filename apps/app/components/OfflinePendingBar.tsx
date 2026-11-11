import { Pressable, Text, View } from "react-native";
import { useEffect, useRef, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { cn } from "@/lib/cn";
import type { QueueItem } from "@/lib/queue-core";
import { colors } from "@/lib/theme";
import { announce } from "@/lib/announce";

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
  const announced = useRef<string | null>(null);

  const failed = items.filter((item) => item.status === "failed");
  const pending = items.filter((item) => item.status === "pending");

  const status = syncing
    ? "Syncing your entries"
    : !isOnline
      ? `Offline. ${outstanding} ${outstanding === 1 ? "entry" : "entries"} will sync when you are back online`
      : failed.length > 0
        ? `${failed.length} ${failed.length === 1 ? "entry" : "entries"} could not be saved`
        : `${outstanding} ${outstanding === 1 ? "entry" : "entries"} saved`;

  useEffect(() => {
    if (announced.current === status) return;
    announced.current = status;
    announce(status);
  }, [status]);

  if (outstanding === 0) return null;

  return (
    <View
      className="mb-3 rounded-xl border border-line bg-surface overflow-hidden"
      accessibilityLiveRegion="polite"
    >
      <Pressable
        onPress={() => setExpanded((value) => !value)}
        className="flex-row items-center px-4 py-3 gap-2"
        accessibilityRole="button"
        accessibilityLabel={status}
        accessibilityState={{ expanded }}
      >
        <Ionicons
          name={
            syncing
              ? "sync"
              : isOnline
                ? failed.length > 0
                  ? "alert-circle"
                  : "cloud-done"
                : "cloud-offline"
          }
          size={16}
          color={failed.length > 0 ? colors.danger : isOnline ? colors.brand : colors.inkMuted}
        />
        <Text className="flex-1 text-xs text-ink-muted">
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
          color={colors.inkMuted}
        />
      </Pressable>

      {expanded && (
        <View className="border-t border-line">
          {[...failed, ...pending].map((item) => (
            <View
              key={item.id}
              className="flex-row items-center px-4 py-2.5 border-b border-line gap-2"
            >
              <View className="flex-1">
                <Text className="text-xs text-white" numberOfLines={1}>
                  {item.kind === "customer.create"
                    ? `Customer: ${String(item.payload.name ?? "")}`
                    : `${item.payload.type === "credit" ? "Credit" : "Payment"} ₹${String(item.payload.amount ?? "")}`}
                </Text>
                {item.lastError && (
                  <Text className="text-xs text-ink-muted" numberOfLines={1}>
                    {item.lastError}
                  </Text>
                )}
              </View>
              {item.status === "failed" ? (
                <>
                  <Pressable
                    onPress={() => onRetry(item.id)}
                    className="min-h-[44px] min-w-[72px] px-3 rounded-lg bg-brand-primary/15 items-center justify-center"
                    accessibilityRole="button"
                    accessibilityLabel="Retry failed sync"
                  >
                    <Text className="text-xs font-semibold text-brand-primary">
                      Retry
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => onDiscard(item.id)}
                    className="min-h-[44px] min-w-[72px] px-3 rounded-lg bg-danger/15 items-center justify-center"
                    accessibilityRole="button"
                    accessibilityLabel="Discard failed sync item"
                  >
                    <Text className="text-xs font-semibold text-danger-text">
                      Discard
                    </Text>
                  </Pressable>
                </>
              ) : (
                <Text className={cn("text-xs text-ink-muted")}>
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
