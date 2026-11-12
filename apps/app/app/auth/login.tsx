import { useCallback, useEffect, useRef, useState } from "react";
import { View, Text, Pressable, ActivityIndicator, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/hooks/useAuth";
import { signInWithGoogle } from "@/lib/auth-session";
import { colors } from "@/lib/theme";
import { LANDING_ROUTE } from "@/lib/routes";

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { session, refresh, completeSignIn } = useAuth();
  const [loading, setLoading] = useState(false);
  // The sign-in handler navigates itself; the effect below must not push a
  // second navigation for the same session.
  const navigated = useRef(false);
  // The provider already resolves the session when the app starts, so the
  // first focus does not need another round trip.
  const focused = useRef(false);

  // A user who authenticated in the browser comes back to this screen. The
  // session is re-resolved on focus so the app can move them on.
  useFocusEffect(
    useCallback(() => {
      if (!focused.current) {
        focused.current = true;
        return;
      }
      void refresh();
    }, [refresh]),
  );

  useEffect(() => {
    if (session && !navigated.current) {
      router.replace(LANDING_ROUTE);
    }
  }, [session]);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const user = await signInWithGoogle();
      // The session is established on the server before this point, so the
      // app can go straight to the landing route.
      navigated.current = true;
      completeSignIn(user);
      router.replace(LANDING_ROUTE);
    } catch (err) {
      navigated.current = false;
      Alert.alert(
        "Sign-in failed",
        err instanceof Error ? err.message : "Please try again",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View
      className="flex-1 justify-between bg-bg px-5"
      style={{ paddingTop: insets.top }}
    >
      <View className="mt-[132px]">
        <Text className="font-plex text-[11px] uppercase tracking-[2px] text-ink-muted">
          Daily khata for small shops
        </Text>
        <Text className="mt-3 font-mukta-black text-[46px] leading-[52px] tracking-[-1px] text-ink">
          Ledger-<Text className="text-brand-primary">X</Text>
        </Text>
        <Text className="mt-3 max-w-[300px] font-mukta text-[16px] leading-[24px] text-ink-muted">
          Know who owes you, record the next entry in seconds, and collect
          faster.
        </Text>
        <View className="mt-8 h-px w-16 bg-line" />
      </View>

      <View className="mb-10">
        <Pressable
          className="min-h-[52px] w-full flex-row items-center justify-center gap-2 rounded-xl bg-brand-primary-fill px-4 active:opacity-80"
          onPress={handleGoogleSignIn}
          disabled={loading}
          accessibilityRole="button"
          accessibilityLabel="Continue with Google"
          accessibilityState={{ disabled: loading, busy: loading }}
        >
          {loading ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <>
              <Ionicons name="logo-google" size={18} color={colors.white} />
              <Text className="font-mukta-semibold text-[16px] text-white">
                Continue with Google
              </Text>
              <Ionicons name="arrow-forward" size={18} color={colors.white} />
            </>
          )}
        </Pressable>
        <Text className="mt-4 text-center font-mukta text-[13px] text-ink-muted">
          Your customers and entries stay private to your account.
        </Text>
      </View>

      <Text className="mb-8 text-center font-plex text-[11px] uppercase tracking-[1.5px] text-ink-muted">
        Built for the counter, not the boardroom
      </Text>
    </View>
  );
}
