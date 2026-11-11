/**
 * Deterministic avatar fills.
 *
 * The customer list and the customer detail header must agree on the same
 * customer's avatar, so the ramp lives in one place. It is built from the
 * brand ramp and true neutrals only — orange is the single chromatic brand
 * hue, and a second hue on a brand mark reads as a different brand.
 */
const RAMP = [
  "from-brand to-brand-light",
  "from-brand-fill to-brand-deep",
  "from-brand-light to-brand-fill",
  "from-stone-400 to-stone-500",
  "from-zinc-400 to-zinc-500",
];

/** The gradient class for a customer's avatar, stable for a given name. */
export function avatarGradient(name: string): string {
  const index =
    name.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) % RAMP.length;
  return RAMP[index];
}
