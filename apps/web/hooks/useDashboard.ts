"use client";

import { useQuery } from "@tanstack/react-query";
import { dashboardApi } from "@/lib/api";

export const dashboardKeys = {
  all: ["dashboard"] as const,
  metrics: () => [...dashboardKeys.all, "metrics"] as const,
  recentTransactions: () => [...dashboardKeys.all, "recent-transactions"] as const,
  analytics: () => [...dashboardKeys.all, "analytics"] as const,
};

/**
 * Polling is the fallback for writes made elsewhere (another device, another
 * tab). A write made in this client is shown by the mutation's own
 * invalidation, so the interval only has to be short enough that a shopkeeper
 * does not notice the gap.
 */
const POLL_INTERVAL = 10_000;

/** The trend and aging aggregates are the heaviest of the three. */
const ANALYTICS_POLL_INTERVAL = 60_000;

/**
 * The dashboard is where a shopkeeper looks for fresh numbers, so it refreshes
 * when the tab regains focus. The client default stays off for the rest of
 * the app, where a focus refetch would be noise.
 */
const DASHBOARD_FOCUS_OPTIONS = { refetchOnWindowFocus: true } as const;

export function useDashboardMetrics() {
  return useQuery({
    queryKey: dashboardKeys.metrics(),
    queryFn: dashboardApi.metrics,
    refetchInterval: POLL_INTERVAL,
    ...DASHBOARD_FOCUS_OPTIONS,
  });
}

export function useRecentTransactions() {
  return useQuery({
    queryKey: dashboardKeys.recentTransactions(),
    queryFn: dashboardApi.recentTransactions,
    refetchInterval: POLL_INTERVAL,
    ...DASHBOARD_FOCUS_OPTIONS,
  });
}

export function useDashboardAnalytics() {
  return useQuery({
    queryKey: dashboardKeys.analytics(),
    queryFn: dashboardApi.analytics,
    refetchInterval: ANALYTICS_POLL_INTERVAL,
    ...DASHBOARD_FOCUS_OPTIONS,
  });
}
