import { createContext, useCallback, useContext, useMemo, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { settingsApi, type UserSettings } from "@/lib/api";
import { settingsKeys } from "@/hooks/query-keys";

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
 * Owns the user settings for the whole app, backed by TanStack Query.
 *
 * Profile, Collection and the onboarding dialog share one cached copy, so
 * saving in one place updates every consumer immediately.
 */
export function SettingsProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: settingsKeys.detail(),
    queryFn: settingsApi.get,
  });

  const mutation = useMutation({
    mutationFn: settingsApi.update,
    onSuccess: async (next) => {
      qc.setQueryData(settingsKeys.detail(), next);
      await qc.invalidateQueries({ queryKey: settingsKeys.all });
    },
  });

  const refresh = useCallback(async () => {
    await query.refetch();
  }, [query.refetch]);

  const update = useCallback(
    async (data: {
      upiId?: string | null;
      payeeName?: string | null;
      onboardingCompleted?: boolean;
      onboardingDismissed?: boolean;
    }) => mutation.mutateAsync(data),
    [mutation.mutateAsync],
  );

  const errorMessage = query.error
    ? query.error instanceof Error
      ? query.error.message
      : "Failed to load settings"
    : null;

  const value = useMemo<SettingsValue>(
    () => ({
      settings: query.data ?? null,
      loading: query.isLoading,
      error: errorMessage,
      refresh,
      update,
    }),
    [query.data, query.isLoading, errorMessage, refresh, update],
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
