// Tiny classnames joiner for NativeWind class strings.
export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}
