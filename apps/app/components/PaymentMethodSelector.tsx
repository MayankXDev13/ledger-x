import { Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { cn } from "@/lib/cn";
import type { PaymentMethod } from "@/lib/api";
import { colors } from "@/lib/theme";

const OPTIONS: {
  value: PaymentMethod | null;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  { value: "cash", label: "Cash", icon: "cash" },
  { value: "upi", label: "UPI", icon: "phone-portrait" },
  { value: "other", label: "Other", icon: "ellipsis-horizontal" },
  { value: null, label: "None", icon: "close" },
];

interface PaymentMethodSelectorProps {
  value: PaymentMethod | null;
  onChange: (value: PaymentMethod | null) => void;
  /** Only meaningful for debits (payments); credits usually leave it unset. */
  disabled?: boolean;
}

export function PaymentMethodSelector({
  value,
  onChange,
  disabled,
}: PaymentMethodSelectorProps) {
  return (
    <View>
      <Text className="text-sm font-medium text-ink-muted mb-2">
        Payment method{" "}
        <Text className="text-ink-muted font-normal">(optional)</Text>
      </Text>
      <View className="flex-row gap-2">
        {OPTIONS.map((option) => {
          const selected = (value ?? null) === option.value;
          return (
            <Pressable
              key={option.label}
              onPress={() => !disabled && onChange(option.value)}
              disabled={disabled}
              className={cn(
                "flex-1 items-center justify-center gap-1 rounded-xl border py-3",
                selected
                  ? "border-brand-primary bg-brand-primary/10"
                  : "border-line bg-surface-raised",
                disabled && "opacity-40",
              )}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              accessibilityLabel={`Payment method ${option.label}`}
            >
              <Ionicons
                name={option.icon}
                size={16}
                color={selected ? colors.brand : colors.inkMuted}
              />
              <Text
                className={cn(
                  "text-[11px] font-semibold",
                  selected ? "text-brand-primary" : "text-ink-muted",
                )}
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
