"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { settingsApi, type UserSettings } from "@/lib/api";
import { toast } from "sonner";

export const settingsKeys = {
  all: ["settings"] as const,
  detail: () => [...settingsKeys.all, "detail"] as const,
};

export function useSettings() {
  return useQuery({
    queryKey: settingsKeys.detail(),
    queryFn: settingsApi.get,
  });
}

export function useUpdateSettings() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: settingsApi.update,
    onSuccess: (data) => {
      qc.setQueryData(settingsKeys.detail(), data);
      qc.invalidateQueries({ queryKey: settingsKeys.all });
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

/** Whether the first-run flow should still be shown. */
export function needsOnboarding(settings?: UserSettings | null): boolean {
  if (!settings) return false;
  return !settings.onboardingCompletedAt && !settings.onboardingDismissedAt;
}
