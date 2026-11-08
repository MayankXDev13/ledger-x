import { useCallback, useEffect, useState } from "react";
import {
  settingsApi,
  type UserSettings,
  ApiError,
} from "@/lib/api";

export function useSettings() {
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

  useEffect(() => {
    refresh();
  }, [refresh]);

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

  return { settings, loading, error, refresh, update };
}

/** Whether the first-run flow should still be shown. */
export function needsOnboarding(settings: UserSettings | null): boolean {
  if (!settings) return false;
  return !settings.onboardingCompletedAt && !settings.onboardingDismissedAt;
}

export { ApiError };
