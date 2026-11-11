import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Button } from "@/components/Button";
import { colors } from "@/lib/theme";

/**
 * Shown when a screen's data request fails.
 *
 * A failed request must never be presented as an empty result, so every list
 * and summary surface renders this instead of its "nothing here" state.
 */
export function ErrorState({
  title = "Could not load this",
  message,
  onRetry,
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <View
      accessibilityLiveRegion="polite"
      className="items-center justify-center gap-3 rounded-2xl border border-line bg-surface px-6 py-10"
    >
      <Ionicons
        name="alert-circle-outline"
        size={28}
        color={colors.dangerText}
      />
      <Text className="font-mukta-semibold text-[15px] text-ink">{title}</Text>
      <Text className="text-center font-mukta text-[13px] text-ink-muted">
        {message ?? "Check your connection and try again."}
      </Text>
      {onRetry ? (
        <Button title="Try again" variant="secondary" onPress={onRetry} />
      ) : null}
    </View>
  );
}
