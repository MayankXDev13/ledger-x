// Feature-flag registry owned by the deployment administrator.
//
// The values are server-side, so the app only reads them: a user can never
// switch a feature on for themselves. TanStack Query re-reads on a bounded
// window and whenever the app comes to the foreground (via focusManager), so
// a flag the administrator changed is picked up without reloading.
import { createContext, useCallback, useContext, useMemo, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { featureFlagsApi } from "@/lib/api";
import { featureFlagKeys } from "@/hooks/query-keys";

/** The flags the deployment ships with. */
export const FEATURE_FLAG_KEYS = [
  "collection",
  "upi_collection",
  "sample_data",
  "account_deletion",
] as const;

export type FeatureFlagKey = (typeof FEATURE_FLAG_KEYS)[number];

export type FeatureFlags = Record<string, boolean>;

/**
 * The flags to use when the registry cannot be read.
 *
 * Failing open matches the server: a transient failure must not hide a
 * feature the administrator never switched off.
 */
export const DEFAULT_FEATURE_FLAGS: FeatureFlags = Object.fromEntries(
  FEATURE_FLAG_KEYS.map((key) => [key, true]),
);

/** How often the registry is re-read while the app is open. */
const REFRESH_INTERVAL_MS = 60_000;

export interface FeatureFlagsValue {
  flags: FeatureFlags;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  /** Whether one flag is on. An unknown flag is off. */
  isEnabled: (key: FeatureFlagKey) => boolean;
}

const FeatureFlagsContext = createContext<FeatureFlagsValue | null>(null);

/**
 * Owns the feature flags for the whole app, backed by TanStack Query.
 */
export function FeatureFlagsProvider({ children }: { children: ReactNode }) {
  const query = useQuery({
    queryKey: featureFlagKeys.all,
    queryFn: featureFlagsApi.get,
    staleTime: REFRESH_INTERVAL_MS,
    refetchInterval: REFRESH_INTERVAL_MS,
    refetchOnWindowFocus: true,
  });

  const flags = useMemo<FeatureFlags>(
    () => (query.data ? { ...DEFAULT_FEATURE_FLAGS, ...query.data } : DEFAULT_FEATURE_FLAGS),
    [query.data],
  );

  const refresh = useCallback(async () => {
    await query.refetch();
  }, [query.refetch]);

  const errorMessage = query.error
    ? query.error instanceof Error
      ? query.error.message
      : "Failed to load flags"
    : null;

  const value = useMemo<FeatureFlagsValue>(
    () => ({
      flags,
      loading: query.isLoading,
      error: errorMessage,
      refresh,
      isEnabled: (key: FeatureFlagKey) => flags[key] === true,
    }),
    [flags, query.isLoading, errorMessage, refresh],
  );

  return (
    <FeatureFlagsContext.Provider value={value}>
      {children}
    </FeatureFlagsContext.Provider>
  );
}

/** The shared feature flags. Throws if used outside the provider. */
export function useFeatureFlags(): FeatureFlagsValue {
  const value = useContext(FeatureFlagsContext);
  if (!value) {
    throw new Error(
      "useFeatureFlags must be used inside a FeatureFlagsProvider",
    );
  }
  return value;
}
