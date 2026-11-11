import {
  useSharedSettings,
  type SettingsValue,
} from "@/lib/settings-provider";

/**
 * The user settings, owned by `SettingsProvider`.
 *
 * Profile, Collection and the onboarding dialog share one copy, so a save in
 * one place is visible everywhere.
 */
export function useSettings(): SettingsValue {
  return useSharedSettings();
}

/** Whether the first-run flow should still be shown. */
export function needsOnboarding(settings: SettingsValue["settings"]): boolean {
  if (!settings) return false;
  return !settings.onboardingCompletedAt && !settings.onboardingDismissedAt;
}
