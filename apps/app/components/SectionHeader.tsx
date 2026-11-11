import type { ReactNode } from "react";
import { Text, View } from "react-native";

interface SectionHeaderProps {
  label: string;
  action?: ReactNode;
  className?: string;
}

/**
 * The ledger "rule": a small mono label above a hairline. Structural, not
 * decorative — it separates sections without adding another card.
 */
export function SectionHeader({ label, action, className }: SectionHeaderProps) {
  return (
    <View className={className}>
      <View className="flex-row items-center justify-between pb-2">
        <Text className="font-plex text-[11px] uppercase tracking-[1.5px] text-ink-muted">
          {label}
        </Text>
        {action}
      </View>
      <View className="h-px bg-line" />
    </View>
  );
}
