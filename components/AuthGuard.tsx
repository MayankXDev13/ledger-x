import { ActivityIndicator, View } from "react-native";
import { useAuth } from "@/hooks/useAuth";
import { publicRoutes } from "@/lib/auth";
import { usePathname, Redirect } from "expo-router";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  const pathname = usePathname();

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
      </View>
    );
  }

  const isPublicRoute = publicRoutes.includes(pathname);

  if (!session && !isPublicRoute) {
    return <Redirect href="/auth/login" />;
  }

  if (session && isPublicRoute) {
    return <Redirect href="/(tabs)/home" />;
  }

  return <>{children}</>;
}
