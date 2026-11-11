/**
 * Runtime design tokens.
 *
 * This is the single source for every value that cannot take a className
 * (Ionicons, ActivityIndicator, Switch, RefreshControl, inline StyleSheet
 * entries) and the reference for values that can. Keep the values in sync with
 * `tailwind.config.js` and `docs/mobile-visual-system.md`.
 */

export const colors = {
  /* Surfaces */
  bg: "#0A0A0A",
  surface: "#171717",
  surfaceRaised: "#262626",
  line: "#262626",

  /* Text */
  ink: "#FAFAFA",
  inkMuted: "#A3A3A3",
  inkFaint: "#737373",
  white: "#FFFFFF",

  /* Brand — orange is the only chromatic brand hue */
  brand: "#EA580C",
  brandFill: "#C2410C",
  brandDeep: "#9A3412",
  brandText: "#FB923C",
  brandSoft: "#FFEDD5",

  /* Semantic */
  positive: "#34D399",
  danger: "#E11D48",
  dangerText: "#FB7185",

  /* Aging buckets — one map for the strip, the legend and every indicator */
  aging0to30: "#737373",
  aging31to60: "#FB7185",
  aging60plus: "#E11D48",
} as const;

/** Spacing rhythm from the visual system contract. */
export const spacing = {
  gutter: 20,
  section: 28,
  cardPadding: 16,
  rowMinHeight: 64,
  touchTarget: 44,
  controlGap: 8,
} as const;

/** Radius scale from the visual system contract. */
export const radius = {
  card: 16,
  control: 12,
  chip: 999,
} as const;

/** Type scale: [size, lineHeight]. */
export const typeScale = {
  hero: [34, 38],
  title: [24, 30],
  section: [16, 22],
  body: [15, 22],
  meta: [13, 18],
  ledgerLabel: [11, 14],
} as const;

/** Screen background colour, for props that need a raw value. */
export const screenBackground = colors.bg;
