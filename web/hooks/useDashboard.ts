"use client";

import { useQuery } from "@tanstack/react-query";
import { dashboardApi } from "@/lib/api";

export const dashboardKeys = {
  all: ["dashboard"] as const,
  metrics: () => [...dashboardKeys.all, "metrics"] as const,
  recentTransactions: () => [...dashboardKeys.all, "recent-transactions"] as const,
};

export function useDashboardMetrics() {
  return useQuery({
    queryKey: dashboardKeys.metrics(),
    queryFn: dashboardApi.metrics,
    refetchInterval: 30_000,
  });
}

export function useRecentTransactions() {
  return useQuery({
    queryKey: dashboardKeys.recentTransactions(),
    queryFn: dashboardApi.recentTransactions,
    refetchInterval: 30_000,
  });
}
