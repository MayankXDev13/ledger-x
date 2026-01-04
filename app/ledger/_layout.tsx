import { Stack } from "expo-router";

export default function LedgerLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: "#FFFFFF" },
        headerTintColor: "#000000",
        headerTitleStyle: { fontWeight: "600" },
        contentStyle: { backgroundColor: "#FFFFFF" },
      }}
    >
      <Stack.Screen name="add" options={{ title: "Add Entry" }} />
    </Stack>
  );
}
