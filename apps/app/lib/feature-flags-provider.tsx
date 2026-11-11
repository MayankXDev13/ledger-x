// Feature-flag registry owned by the deployment administrator.
//
// The values are server-side, so the app only reads them: a user can never
// switch a feature on for themselves. The registry is re-read on a bounded
// window and whenever the app comes to the foreground, so a flag the
// administrator changed is picked up without the user reloading.
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { AppState, type AppStateStatus } from "react-native";
import { featureFlagsApi } from "@/lib/api";

/** The flags the deployment ships with. */
export const FEATURE_FLAG_KEYS = ["collection", "upi_collection"] as const;

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
 * Owns the feature flags for the whole app.
 *
 * Modelled on `SettingsProvider`, so a screen never reads the registry
 * itself and every screen sees the same values.
 */
export function FeatureFlagsProvider({ children }: { children: ReactNode }) {
  const [flags, setFlags] = useState<FeatureFlags>(DEFAULT_FEATURE_FLAGS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const next = await featureFlagsApi.get();
      setFlags({ ...DEFAULT_FEATURE_FLAGS, ...next });
      setError(null);
    } catch (err) {
      // Keep the last known values: a failed read must not hide a feature.
      setError(err instanceof Error ? err.message : "Failed to load flags");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Re-read on a bounded window and whenever the app comes back to the
  // foreground, so an administrator's change is picked up.
  useEffect(() => {
    const timer = setInterval(refresh, REFRESH_INTERVAL_MS);
    const subscription = AppState.addEventListener(
      "change",
      (state: AppStateStatus) => {
        if (state === "active") refresh();
      },
    );
    return () => {
      clearInterval(timer);
      subscription.remove();
    };
  }, [refresh]);

  const value = useMemo<FeatureFlagsValue>(
    () => ({
      flags,
      loading,
      error,
      refresh,
      isEnabled: (key: FeatureFlagKey) => flags[key] === true,
    }),
    [flags, loading, error, refresh],
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
