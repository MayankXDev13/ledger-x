import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import AuthGuard from "@/components/AuthGuard";
import { publicRoutes } from "@/lib/auth";
import "../global.css"

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <AuthGuard>
        <Stack screenOptions={{ headerShown: false }} />
      </AuthGuard>
    </>
  );
}

export { publicRoutes };
