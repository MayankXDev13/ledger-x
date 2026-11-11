/**
 * The flags the deployment ships with.
 *
 * The values are owned by the deployment administrator, so a client never
 * writes them; it only reads them and honours what it is told.
 */
export const FEATURE_FLAG_KEYS = [
  "collection",
  "upi_collection",
  "sample_data",
  "account_deletion",
] as const;

export type FeatureFlagKey = (typeof FEATURE_FLAG_KEYS)[number];

/**
 * Every registered flag and whether it is on.
 *
 * A key the registry does not carry is off: the administrator has to
 * register a flag before it opens anything.
 */
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

/** Whether one flag is on. An unknown flag is off. */
export function isFeatureEnabled(
  flags: FeatureFlags | undefined,
  key: FeatureFlagKey,
): boolean {
  if (!flags) return DEFAULT_FEATURE_FLAGS[key] === true;
  return flags[key] === true;
}
