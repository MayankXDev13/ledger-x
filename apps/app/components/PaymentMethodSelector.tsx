import { Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { cn } from "@/lib/cn";
import type { PaymentMethod } from "@/lib/api";

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
      <Text className="text-sm font-medium text-[#A0A0A0] mb-2">
        Payment method{" "}
        <Text className="text-[#666666] font-normal">(optional)</Text>
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
                  ? "border-[#10B981] bg-[#10B981]/10"
                  : "border-[#3D3D3D] bg-[#2D2D2D]",
                disabled && "opacity-40",
              )}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              accessibilityLabel={`Payment method ${option.label}`}
            >
              <Ionicons
                name={option.icon}
                size={16}
                color={selected ? "#10B981" : "#888888"}
              />
              <Text
                className={cn(
                  "text-[11px] font-semibold",
                  selected ? "text-[#10B981]" : "text-[#888888]",
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
