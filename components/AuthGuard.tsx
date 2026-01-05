import { useEffect } from "react";
import { Redirect, usePathname } from "expo-router";
import { useAuth } from "@/hooks/useAuth";

const publicRoutes = ["/", "/auth/login", "/auth/signup"];

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  const pathname = usePathname();

  if (loading) {
    return null;
  }

  const isPublicRoute = publicRoutes.includes(pathname);

  if (!session && !isPublicRoute) {
    return <Redirect href="/auth/login" />;
  }

  if (session && isPublicRoute) {
    return <Redirect href="/home" />;
  }

  return <>{children}</>;
}
