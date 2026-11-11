import type { Db } from "../db";
import { featureFlags } from "../db/schema";

/**
 * The flags the deployment ships with.
 *
 * A key the registry does not carry resolves to disabled, so a flag only
 * opens a feature once the administrator has registered it.
 */
export const FEATURE_FLAG_KEYS = [
  "collection",
  "upi_collection",
  "sample_data",
  "account_deletion",
] as const;

export type FeatureFlagKey = (typeof FEATURE_FLAG_KEYS)[number];

/** Every registered flag and whether it is on. */
export type FeatureFlags = Record<string, boolean>;

/**
 * Reads the feature-flag registry.
 *
 * A read that fails — the table before the migration ran, a database blip —
 * resolves every flag to enabled: a transient failure must never hide a
 * working feature. The failure is logged so the operator can see it.
 */
export async function readFeatureFlags(db: Db): Promise<FeatureFlags> {
  try {
    const rows = await db
      .select({ key: featureFlags.key, enabled: featureFlags.enabled })
      .from(featureFlags);

    const flags: FeatureFlags = {};
    for (const row of rows) {
      flags[row.key] = row.enabled;
    }

    // A shipped flag the registry does not carry is off, not on by default.
    for (const key of FEATURE_FLAG_KEYS) {
      if (!(key in flags)) flags[key] = false;
    }

    return flags;
  } catch (error) {
    console.error("feature flags: registry read failed, failing open", error);
    return Object.fromEntries(
      FEATURE_FLAG_KEYS.map((key) => [key, true]),
    ) as FeatureFlags;
  }
}

/** Whether one flag is on. An unknown flag is off. */
export function isEnabled(
  flags: FeatureFlags,
  key: FeatureFlagKey,
): boolean {
  return flags[key] === true;
}
