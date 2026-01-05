import { Stack } from "expo-router";

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: "#1a1a1a" },
        headerTintColor: "#ffffff",
        headerTitleStyle: { fontWeight: "600" },
        contentStyle: { backgroundColor: "#1a1a1a" },
      }}
    >
      <Stack.Screen name="login" options={{ title: "Login" }} />
      <Stack.Screen name="signup" options={{ title: "Sign Up" }} />
    </Stack>
  );
}
