import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { settingsApi, type UserSettings } from "@/lib/api";

export interface SettingsValue {
  settings: UserSettings | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  update: (data: {
    upiId?: string | null;
    payeeName?: string | null;
    onboardingCompleted?: boolean;
    onboardingDismissed?: boolean;
  }) => Promise<UserSettings>;
}

const SettingsContext = createContext<SettingsValue | null>(null);

/**
 * Owns the user settings for the whole app.
 *
 * Profile, Collection and the onboarding dialog used to keep separate copies
 * of the same settings, so saving in one place silently reverted the other.
 */
export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setError(null);
      setSettings(await settingsApi.get());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load settings");
    } finally {
      setLoading(false);
    }
  }, []);

  const update = useCallback(
    async (data: {
      upiId?: string | null;
      payeeName?: string | null;
      onboardingCompleted?: boolean;
      onboardingDismissed?: boolean;
    }) => {
      const next = await settingsApi.update(data);
      setSettings(next);
      return next;
    },
    [],
  );

  useEffect(() => {
    refresh();
  }, [refresh]);

  const value = useMemo<SettingsValue>(
    () => ({ settings, loading, error, refresh, update }),
    [settings, loading, error, refresh, update],
  );

  return (
    <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
  );
}

/** The shared settings. Throws if used outside the provider. */
export function useSharedSettings(): SettingsValue {
  const value = useContext(SettingsContext);
  if (!value) {
    throw new Error("useSharedSettings must be used inside a SettingsProvider");
  }
  return value;
}
