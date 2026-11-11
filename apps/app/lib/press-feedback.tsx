import { useEffect, useState } from "react";
import { AccessibilityInfo, type StyleProp, type ViewStyle } from "react-native";
import {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

/**
 * The one press-feedback implementation.
 *
 * The visual system asks for 0.8 opacity plus a darker fill over 120ms, and
 * for that transition to disappear when the device requests reduced motion.
 * NativeWind's `active:` variant applies instantly, so the timing lives here.
 */
export const PRESS_DURATION_MS = 120;

/**
 * Returns the animated press style and the press handlers.
 *
 * Spread the handlers onto a `Pressable` and add `animatedStyle` to its style:
 *
 * ```tsx
 * const press = usePressable();
 * <Pressable onPressIn={press.onPressIn} onPressOut={press.onPressOut} style={[styles.row, press.animatedStyle]}>
 * ```
 */
export function usePressable() {
  const progress = useSharedValue(0);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    let cancelled = false;
    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (!cancelled) setReduceMotion(enabled);
    });
    const subscription = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      (enabled) => setReduceMotion(enabled),
    );
    return () => {
      cancelled = true;
      subscription.remove();
    };
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: 1 - progress.value * 0.2,
  }));

  const onPressIn = () => {
    progress.value = reduceMotion ? 1 : withTiming(1, { duration: PRESS_DURATION_MS });
  };

  const onPressOut = () => {
    progress.value = reduceMotion ? 0 : withTiming(0, { duration: PRESS_DURATION_MS });
  };

  return {
    // Reanimated's animated style type is not structurally assignable to
    // `StyleProp<ViewStyle>`; it holds a plain opacity value, so it is safe
    // to pass straight to a `Pressable` style array.
    animatedStyle: animatedStyle as unknown as StyleProp<ViewStyle>,
    onPressIn,
    onPressOut,
    reduceMotion,
  };
}
