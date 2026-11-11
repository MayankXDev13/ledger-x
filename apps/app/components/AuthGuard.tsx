import { ActivityIndicator, View } from "react-native";
import { useAuth } from "@/hooks/useAuth";
import { publicRoutes } from "@/lib/auth";
import { usePathname, Redirect } from "expo-router";
import { colors } from "@/lib/theme";
import { LANDING_ROUTE } from "@/lib/routes";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  const pathname = usePathname();

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.bg,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator size="large" color={colors.ink} />
      </View>
    );
  }

  const isPublicRoute = publicRoutes.includes(pathname);

  if (!session && !isPublicRoute) {
    return <Redirect href="/auth/login" />;
  }

  if (session && isPublicRoute) {
    // One canonical landing route for every sign-in path.
    return <Redirect href={LANDING_ROUTE} />;
  }

  return <>{children}</>;
}
