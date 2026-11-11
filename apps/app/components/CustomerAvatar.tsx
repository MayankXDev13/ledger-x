import { Text, View } from "react-native";

export function CustomerAvatar({
  name,
  size = 40,
}: {
  name: string;
  size?: number;
}) {
  const trimmed = name.trim();
  const initial = (trimmed.charAt(0) || "?").toUpperCase();
  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={`Avatar for ${trimmed || "unknown customer"}`}
      className="items-center justify-center rounded-full border border-line bg-surface-raised"
      style={{ width: size, height: size, borderRadius: size / 2 }}
    >
      <Text
        className="font-mukta-semibold text-ink"
        style={{ fontSize: size * 0.42 }}
        numberOfLines={1}
      >
        {initial}
      </Text>
    </View>
  );
}
