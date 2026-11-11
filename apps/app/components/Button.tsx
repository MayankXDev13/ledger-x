import type { ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  Text,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { cn } from "@/lib/cn";
import { usePressable } from "@/lib/press-feedback";
import { colors } from "@/lib/theme";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  icon?: ReactNode;
  className?: string;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

const VARIANT_SURFACE: Record<ButtonVariant, string> = {
  primary: "bg-brand-primary-fill active:bg-brand-deep",
  secondary: "border border-line bg-transparent active:bg-surface-raised",
  ghost: "bg-transparent active:bg-surface",
  danger: "bg-danger active:bg-danger-text",
};

const VARIANT_TEXT: Record<ButtonVariant, string> = {
  primary: "text-white",
  secondary: "text-ink",
  ghost: "text-ink",
  danger: "text-white",
};

export function Button({
  title,
  onPress,
  variant = "primary",
  disabled = false,
  loading = false,
  icon,
  className,
  style,
  accessibilityLabel,
}: ButtonProps) {
  const inactive = disabled || loading;
  const press = usePressable();

  return (
    <Pressable
      onPress={onPress}
      onPressIn={press.onPressIn}
      onPressOut={press.onPressOut}
      disabled={inactive}
      style={[style, press.animatedStyle]}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{ disabled: inactive, busy: loading }}
      className={cn(
        "min-h-[48px] flex-row items-center justify-center gap-2 rounded-xl px-4",
        VARIANT_SURFACE[variant],
        inactive && "opacity-50",
        className,
      )}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === "primary" || variant === "danger" ? colors.white : colors.brand}
        />
      ) : (
        <>
          {icon}
          <Text className={cn("font-mukta-semibold text-[15px]", VARIANT_TEXT[variant])}>
            {title}
          </Text>
        </>
      )}
    </Pressable>
  );
}
