"use client";

import { useQuery } from "@tanstack/react-query";
import { featureFlagsApi } from "@/lib/api";
import {
  DEFAULT_FEATURE_FLAGS,
  isFeatureEnabled,
  type FeatureFlagKey,
  type FeatureFlags,
} from "@/lib/feature-flags";

export const featureFlagKeys = {
  all: ["feature-flags"] as const,
};

/**
 * How often the registry is re-read while the app is open.
 *
 * The interval is what lets a tab that is left open notice a flag the
 * administrator changed, without the user reloading.
 */
const REFRESH_INTERVAL_MS = 1000 * 60;

/**
 * The deployment's feature-flag registry.
 *
 * The flags are administrator-owned, so the client only reads them. The read
 * is repeated on a bounded window and whenever the tab regains focus, so a
 * flag the administrator changed is picked up without the user reloading.
 */
export function useFeatureFlags() {
  const query = useQuery({
    queryKey: featureFlagKeys.all,
    queryFn: featureFlagsApi.get,
    staleTime: REFRESH_INTERVAL_MS,
    refetchInterval: REFRESH_INTERVAL_MS,
    refetchOnWindowFocus: true,
  });

  const flags: FeatureFlags = query.data ?? DEFAULT_FEATURE_FLAGS;

  return {
    flags,
    isLoading: query.isLoading,
    isEnabled: (key: FeatureFlagKey) => isFeatureEnabled(flags, key),
  };
}
