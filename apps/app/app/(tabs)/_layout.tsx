import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "@/lib/theme";
import { useFeatureFlags } from "@/lib/feature-flags-provider";

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const { isEnabled, loading } = useFeatureFlags();

  // The Collection tab is behind the administrator's collection flag. It is
  // held back until the registry is known, so a disabled feature never
  // flashes on screen.
  const collectionEnabled = !loading && isEnabled("collection");

  const bottomPadding = Math.max(insets.bottom, 12);

  return (
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: colors.bg,
            borderTopColor: colors.line,
            borderTopWidth: 1,
            paddingTop: 8,
            paddingBottom: bottomPadding,
            height: 60 + bottomPadding,
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
          // `href: null` removes the tab from the bar and blocks the route.
          href: collectionEnabled ? undefined : null,
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
