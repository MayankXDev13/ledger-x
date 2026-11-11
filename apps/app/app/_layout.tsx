import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import AuthGuard from "@/components/AuthGuard";
import { AppLockGate } from "@/components/AppLockGate";
import { publicRoutes } from "@/lib/auth";
import "../global.css";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { SessionProvider } from "@/lib/session-provider";
import { SettingsProvider } from "@/lib/settings-provider";
import { OfflineQueueProvider } from "@/hooks/useOfflineQueue";
import { StyleSheet } from "react-native";
import {
  useFonts,
  Mukta_400Regular,
  Mukta_500Medium,
  Mukta_600SemiBold,
  Mukta_700Bold,
  Mukta_800ExtraBold,
} from "@expo-google-fonts/mukta";
import { IBMPlexMono_500Medium } from "@expo-google-fonts/ibm-plex-mono";

/*
 * Fonts are loaded opportunistically: a slow or failed font load falls back
 * to the system face instead of blanking the app. Money still uses tabular
 * numerals, so alignment survives the fallback.
 */
export default function RootLayout() {
  useFonts({
    Mukta_400Regular,
    Mukta_500Medium,
    Mukta_600SemiBold,
    Mukta_700Bold,
    Mukta_800ExtraBold,
    IBMPlexMono_500Medium,
  });

  return (
    <SafeAreaProvider>
      {/* Global status bar */}
      <StatusBar style="light" />

      {/* Screens paint their own background and top inset padding, so this
          wrapper only handles left/right. (Top edge here used to paint a
          black strip above every screen.) */}
      <SafeAreaView style={styles.container} edges={["left", "right"]}>
        {/* One session, one settings copy and one offline queue for the app. */}
        <SessionProvider>
          <SettingsProvider>
            <OfflineQueueProvider>
              <AuthGuard>
                <AppLockGate>
                  <Stack screenOptions={{ headerShown: false }} />
                </AppLockGate>
              </AuthGuard>
            </OfflineQueueProvider>
          </SettingsProvider>
        </SessionProvider>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

export { publicRoutes };

const styles = StyleSheet.create({
  container: { flex: 1 },
});
