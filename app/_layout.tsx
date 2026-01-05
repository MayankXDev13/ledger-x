import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import AuthGuard from "@/components/AuthGuard";

const publicRoutes = ["/", "/auth/login", "/auth/signup"];

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
