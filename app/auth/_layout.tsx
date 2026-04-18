import { Stack } from "expo-router";

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: "#0A0A0A" },
        headerTintColor: "#ffffff",
        headerTitleStyle: { fontWeight: "600" },
        contentStyle: { backgroundColor: "#0A0A0A" },
      }}
    >
      <Stack.Screen name="login" options={{ title: "Login" }} />
      <Stack.Screen name="signup" options={{ title: "Sign Up" }} />
      <Stack.Screen
        name="forgot-password"
        options={{ title: "Forgot Password" }}
      />
      <Stack.Screen
        name="reset-password"
        options={{ title: "Reset Password" }}
      />
    </Stack>
  );
}
