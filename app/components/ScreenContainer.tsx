import React from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  StyleProp,
  ViewStyle,
  ScrollViewProps,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

type ScreenContainerProps = {
  children?: React.ReactNode;
  scroll?: boolean;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  edges?: Array<"top" | "bottom" | "left" | "right">;
  horizontalPadding?: number;
  topSpacing?: number;
  bottomSpacing?: number;
} & Partial<ScrollViewProps>;

export default function ScreenContainer({
  children,
  scroll,
  style,
  contentContainerStyle,
  edges = ["top", "left", "right"],
  horizontalPadding = 24,
  topSpacing = 12,
  bottomSpacing = 12,
  ...scrollProps
}: ScreenContainerProps) {
  const insets = useSafeAreaInsets();
  const paddingTop = (edges.includes("top") ? insets.top : 0) + topSpacing;
  const paddingBottom =
    (edges.includes("bottom") ? insets.bottom : 0) + bottomSpacing;

  if (scroll) {
    return (
      <SafeAreaView style={[styles.safe, style]} edges={edges}>
        <ScrollView
          contentContainerStyle={[
            { paddingHorizontal: horizontalPadding, paddingTop, paddingBottom },
            contentContainerStyle,
          ]}
          keyboardShouldPersistTaps="handled"
          {...(scrollProps as ScrollViewProps)}
        >
          {children}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, style]} edges={edges}>
      <View
        style={{
          flex: 1,
          paddingHorizontal: horizontalPadding,
          paddingTop,
          paddingBottom,
        }}
      >
        {children}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
});
