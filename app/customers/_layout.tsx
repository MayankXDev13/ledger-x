import { Stack } from "expo-router";

export default function CustomersLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: "#FFFFFF",
        },
        headerTintColor: "#000000",
        headerTitleStyle: {
          fontWeight: "600",
        },
        contentStyle: {
          backgroundColor: "#FFFFFF",
        },
      }}
    >
      <Stack.Screen
        name="index"
        options={{ title: "Customers", headerShown: false }}
      />
      <Stack.Screen name="add" options={{ title: "Add Customer" }} />
      <Stack.Screen name="details" options={{ title: "Customer Details" }} />
    </Stack>
  );
}
