import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "@/lib/theme";

export default function TabsLayout() {
  const insets = useSafeAreaInsets();

  return (
      <Tabs
        screenOptions={{
          headerShown: false,
          // The tab bar is sized by React Navigation so it accounts for the
          // bottom safe area. Setting an explicit height here left only
          // ~40px for a 24px icon and an 11px label, which clipped the label
          // on notched devices.
          tabBarStyle: {
            backgroundColor: colors.bg,
            borderTopColor: colors.line,
            borderTopWidth: 1,
            paddingTop: 6,
          },
          tabBarActiveTintColor: colors.brand,
          tabBarInactiveTintColor: colors.inkMuted,
          tabBarLabelStyle: {
            fontFamily: "Mukta_600SemiBold",
            fontSize: 11,
            fontWeight: "600",
          },
        }}
      >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "home" : "home-outline"}
              size={24}
              color={typeof color === "string" ? color : undefined}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="ledger"
        options={{
          title: "Ledger",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "journal" : "journal-outline"}
              size={24}
              color={typeof color === "string" ? color : undefined}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="collection"
        options={{
          title: "Collection",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "qr-code" : "qr-code-outline"}
              size={24}
              color={typeof color === "string" ? color : undefined}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="customers"
        options={{
          title: "Customers",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "people" : "people-outline"}
              size={24}
              color={typeof color === "string" ? color : undefined}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "person" : "person-outline"}
              size={24}
              color={typeof color === "string" ? color : undefined}
            />
          ),
        }}
      />
    </Tabs>
  );
}
