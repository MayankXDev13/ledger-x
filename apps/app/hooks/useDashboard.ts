import { useQuery } from "@tanstack/react-query";
import { dashboardApi } from "@/lib/api";
import { dashboardKeys } from "./query-keys";

export { dashboardKeys };

export function useDashboardMetrics(enabled = true) {
  return useQuery({
    queryKey: dashboardKeys.metrics(),
    queryFn: dashboardApi.metrics,
    enabled,
  });
}

export function useRecentTransactions(enabled = true) {
  return useQuery({
    queryKey: dashboardKeys.recentTransactions(),
    queryFn: dashboardApi.recentTransactions,
    enabled,
  });
}

export function useDashboardAnalytics(enabled = true) {
  return useQuery({
    queryKey: dashboardKeys.analytics(),
    queryFn: dashboardApi.analytics,
    enabled,
  });
}
