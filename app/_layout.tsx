import { Stack, Redirect } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, View } from "react-native";
import { useAuth } from "@/hooks/useAuth";

export default function RootLayout() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#1a1a1a",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator size="large" color="#fff" />
        <StatusBar style="light" />
      </View>
    );
  }

  if (!session) {
    return <Redirect href="/auth/login" />;
  }

  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }} />
    </>
  );
}
