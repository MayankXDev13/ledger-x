import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import AuthGuard from "@/components/AuthGuard";
import { AppLockGate } from "@/components/AppLockGate";
import { publicRoutes } from "@/lib/auth";
import "../global.css";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { StyleSheet } from "react-native";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      {/* Global status bar */}
      <StatusBar style="light" />

      {/* Ensure top/left/right safe insets are applied across all screens.
          Keep full height with flex: 1 so children Stack fills the screen. */}
      <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
        <AuthGuard>
          <AppLockGate>
            <Stack screenOptions={{ headerShown: false }} />
          </AppLockGate>
        </AuthGuard>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

export { publicRoutes };

const styles = StyleSheet.create({
  container: { flex: 1 },
});
